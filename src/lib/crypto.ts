/**
 * Utility for symmetric encryption/decryption using the Web Crypto API (AES-GCM).
 * This ensures that sensitive API keys are not stored in plaintext in the database.
 */

// We expect a 32-byte hex-encoded key or a regular string (which we hash to 32 bytes)
const getSecretKey = async () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "default_dev_secret_do_not_use_in_prod";
  
  // We need to derive a 256-bit (32 byte) key from the secret
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("pathweaver-salt"), // Static salt since we use a static secret
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptText(text: string) {
  const key = await getSecretKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);

  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  );

  return {
    cipherText: arrayBufferToBase64(encryptedContent),
    iv: arrayBufferToBase64(iv.buffer)
  };
}

export async function decryptText(cipherTextBase64: string, ivBase64: string) {
  const key = await getSecretKey();
  const iv = base64ToArrayBuffer(ivBase64);
  const encryptedContent = base64ToArrayBuffer(cipherTextBase64);

  try {
    const decryptedContent = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      encryptedContent
    );
    return new TextDecoder().decode(decryptedContent);
  } catch (e) {
    console.error("Failed to decrypt text", e);
    return null;
  }
}
