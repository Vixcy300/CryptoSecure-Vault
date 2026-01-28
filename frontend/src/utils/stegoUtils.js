/**
 * stegoUtils.js - Client-Side LSB-3 Steganography
 * 
 * Implements LSB-3 (Last 3 Significant Bits) steganography.
 * Capacity: 3 bits per channel * 3 channels = 9 bits per pixel.
 * 
 * Features:
 * - Magic String "CSSTGO" for validation
 * - Embeds original filename and extension
 * - Auto-Sanitization: Draws to canvas first to normalize pixel data
 */

const MAGIC_STRING = "CSSTGO";

// Helper: Convert number to 32-bit binary string
const toBinary32 = (num) => num.toString(2).padStart(32, '0');

// Helper: Convert number to 16-bit binary string
const toBinary16 = (num) => num.toString(2).padStart(16, '0');

// Helper: Convert byte to 8-bit binary string
const toBinary8 = (byte) => byte.toString(2).padStart(8, '0');

// Helper: Convert string to binary string (8 bits per char)
const stringToBinary = (str) => {
    let bin = '';
    for (let i = 0; i < str.length; i++) {
        bin += toBinary8(str.charCodeAt(i));
    }
    return bin;
};

// Helper: Convert binary string to string
const binaryToString = (bin) => {
    let str = '';
    for (let i = 0; i < bin.length; i += 8) {
        str += String.fromCharCode(parseInt(bin.slice(i, i + 8), 2));
    }
    return str;
};

// Helper: Convert binary string to byte array
const binaryToBytes = (bin) => {
    // Pad if not multiple of 8 (shouldn't happen with correct logic but safe to handle)
    const padding = bin.length % 8;
    if (padding !== 0) bin += '0'.repeat(8 - padding);

    const bytes = new Uint8Array(bin.length / 8);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bin.slice(i * 8, (i + 1) * 8), 2);
    }
    return bytes;
};

// Helper: Sanitize Image (Fixes "not working" on some images)
// Draws image to a fresh canvas to ensure consistent RGBA pixel data
const sanitizeImage = (file) => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            resolve({ ctx, width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = url;
    });
};

/**
 * Encodes a file into an image using LSB-3.
 */
export const encodeLSB = async (imageFile, secretFile) => {
    console.log('Starting LSB-3 Encoding...');

    // 1. Read Secret File
    const secretBuffer = await secretFile.arrayBuffer();
    const secretBytes = new Uint8Array(secretBuffer);
    const fileName = secretFile.name;

    // 2. Prepare Header
    const magicBits = stringToBinary(MAGIC_STRING);
    const safeNameLen = Math.min(fileName.length, 65535);
    const nameLenBits = toBinary16(safeNameLen);
    const nameBits = stringToBinary(fileName.substring(0, safeNameLen));
    const dataLenBits = toBinary32(secretBytes.length);

    // 3. Prepare Data Bits
    let dataBits = '';
    for (let byte of secretBytes) {
        dataBits += toBinary8(byte);
    }

    // Combine all bits
    const fullBitStream = magicBits + nameLenBits + nameBits + dataLenBits + dataBits;

    console.log(`Embedding: ${fileName}. Bits needed: ${fullBitStream.length}`);

    // 4. Sanitize & Load Image
    const { ctx, width, height } = await sanitizeImage(imageFile);
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    // 5. Capacity Check (LSB-3 = 3 bits per channel * 3 channels = 9 bits per pixel)
    // We skip Alpha channel.
    const totalPixels = width * height;
    const capacityBits = totalPixels * 9;

    if (fullBitStream.length > capacityBits) {
        throw new Error(`Image too small. Need ${(fullBitStream.length / 1024 / 8).toFixed(2)} KB, but capacity is ${(capacityBits / 1024 / 8).toFixed(2)} KB.`);
    }

    // 6. Embed Bits (3 at a time)
    let bitIndex = 0;

    // Iterate pixels
    for (let i = 0; i < pixels.length; i += 4) {
        // Iterate RGB channels (0, 1, 2)
        for (let j = 0; j < 3; j++) {
            if (bitIndex >= fullBitStream.length) break;

            // Get next 3 bits (or remaining if < 3)
            let chunk = '';
            const bitsLeft = fullBitStream.length - bitIndex;

            if (bitsLeft >= 3) {
                chunk = fullBitStream.substring(bitIndex, bitIndex + 3);
            } else {
                // Should theoretically not happen if we pad, but safe fallback
                chunk = fullBitStream.substring(bitIndex).padEnd(3, '0');
            }

            const val = parseInt(chunk, 2);

            // Clear last 3 bits (& ~7) and set new 3 bits (| val)
            // ~7 is ...11111000
            pixels[i + j] = (pixels[i + j] & 0xF8) | val;

            bitIndex += 3;
        }
        if (bitIndex >= fullBitStream.length) break;
    }

    // 7. Update Canvas and Export
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
};

/**
 * Decodes a file from an image using LSB-3.
 */
export const decodeLSB = async (imageFile) => {
    console.log('Starting LSB-3 Decoding...');

    // 1. Sanitize & Load Image
    const { ctx, width, height } = await sanitizeImage(imageFile);
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    let pIdx = 0; // Pixel channel index

    // Helper: Read N bits
    const readNextBits = (n) => {
        let bits = '';
        while (bits.length < n) {
            if (pIdx >= pixels.length) throw new Error('Unexpected end of stream');

            // Skip Alpha (Every 4th byte: 3, 7, 11...)
            if ((pIdx + 1) % 4 === 0) {
                pIdx++;
                continue;
            }

            // Read last 3 bits
            const val = pixels[pIdx] & 7; // 0x07
            const chunk = val.toString(2).padStart(3, '0');

            // Find how many bits we actually need to append
            const needed = n - bits.length;
            if (needed >= 3) {
                bits += chunk;
            } else {
                bits += chunk.substring(0, needed);
            }

            pIdx++;
        }
        return bits;
    };

    // --- DECODING PROCESS ---

    // 1. Magic String (48 bits)
    const magicBits = readNextBits(48);
    const magicStr = binaryToString(magicBits);

    if (magicStr !== MAGIC_STRING) {
        throw new Error('Invalid Image: No LSB-3 hidden data found (Missing Magic Signature "CSSTGO").');
    }

    // 2. Name Length (16 bits)
    const nameLen = parseInt(readNextBits(16), 2);

    // 3. Filename
    const fileName = binaryToString(readNextBits(nameLen * 8));

    // 4. Data Length (32 bits)
    const dataLen = parseInt(readNextBits(32), 2);
    console.log(`Detected File: ${fileName} (${dataLen} bytes)`);

    // 5. Data Content
    const dataBits = readNextBits(dataLen * 8);
    const finalBytes = binaryToBytes(dataBits);

    const blob = new Blob([finalBytes], { type: 'application/octet-stream' });
    blob.name = fileName;
    return blob;
};

// Helper: Get dimensions
export const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = url;
    });
};

/**
 * Calculates max storage capacity (LSB-3)
 * Capacity = (Pixels * 3 channels * 3 bits) / 8 bits
 */
export const calculateCapacity = async (imageFile) => {
    const { width, height } = await getImageDimensions(imageFile);
    // 9 bits per pixel
    const totalBits = width * height * 9;
    const totalBytes = Math.floor(totalBits / 8);
    return totalBytes - 50; // Overhead
};
