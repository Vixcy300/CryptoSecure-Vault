// Unicode-safe base64 encoding/decoding utilities
// Standard btoa/atob only work with Latin1, this handles all Unicode characters

/**
 * Encode a Unicode string to base64
 * @param {string} str - The Unicode string to encode
 * @returns {string} - Base64 encoded string
 */
export const toBase64 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
};

/**
 * Decode a base64 string to Unicode
 * @param {string} str - The base64 encoded string
 * @returns {string} - Decoded Unicode string
 */
export const fromBase64 = (str) => {
    try {
        const binary = atob(str);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        console.error('Base64 decode error:', e);
        return str; // Return original if decode fails
    }
};
