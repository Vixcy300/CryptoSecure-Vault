/**
 * Encryption and Storage Module
 * Implements Hybrid AES-256 + ECC Cryptography
 */

// Generate random bytes for keys and IVs
export const generateRandomBytes = (length) => {
    return crypto.getRandomValues(new Uint8Array(length));
};

// Derive encryption key using PBKDF2 (Argon2id simulation for browser)
export const deriveKey = async (password, salt) => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

// Generate ECC key pair for asymmetric encryption
export const generateECCKeyPair = async () => {
    return crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        true,
        ['deriveKey']
    );
};

// Encrypt file with AES-256-GCM
export const encryptFile = async (file, key) => {
    const iv = generateRandomBytes(12);
    const fileData = await file.arrayBuffer();

    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        fileData
    );

    return {
        encryptedData: new Uint8Array(encryptedData),
        iv: Array.from(iv),
        algorithm: 'AES-256-GCM'
    };
};

// Decrypt file with AES-256-GCM
export const decryptFile = async (encryptedData, key, iv) => {
    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        encryptedData
    );

    return new Uint8Array(decryptedData);
};

// Derive shared secret using ECDH for file sharing
export const deriveSharedSecret = async (privateKey, publicKey) => {
    return crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: publicKey
        },
        privateKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

// Export public key for sharing
export const exportPublicKey = async (keyPair) => {
    const exported = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

// Calculate file hash for integrity verification
export const calculateFileHash = async (data) => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

// Encryption status for storage
export const EncryptionStatus = {
    PENDING: 'pending',
    ENCRYPTING: 'encrypting',
    ENCRYPTED: 'encrypted',
    DECRYPTING: 'decrypting',
    FAILED: 'failed'
};

export default {
    generateRandomBytes,
    deriveKey,
    generateECCKeyPair,
    encryptFile,
    decryptFile,
    deriveSharedSecret,
    exportPublicKey,
    calculateFileHash,
    EncryptionStatus
};
