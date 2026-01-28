// Utility for Client-Side Encryption
// Uses Web Crypto API for performance and security

export const generateAESKey = async () => {
    return await window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true, // extractable
        ['encrypt', 'decrypt']
    );
};

export const encryptFile = async (file, key) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const arrayBuffer = await file.arrayBuffer();

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        arrayBuffer
    );

    return {
        encryptedBlob: new Blob([encryptedContent]),
        iv: Array.from(iv), // Convert to array for sending to JSON/Server
    };
};

export const decryptFile = async (encryptedBlob, key, ivArray) => {
    const iv = new Uint8Array(ivArray);
    const arrayBuffer = await encryptedBlob.arrayBuffer();

    const decryptedContent = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        arrayBuffer
    );

    return new Blob([decryptedContent]);
};

export const exportKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return Array.from(new Uint8Array(exported));
};

export const importKey = async (rawKeyArray) => {
    return await window.crypto.subtle.importKey(
        'raw',
        new Uint8Array(rawKeyArray),
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
    );
};
