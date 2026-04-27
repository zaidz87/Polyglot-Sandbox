import crypto from 'crypto';

/**
 * Simple MD5 hashing utility used primarily for
 * standardizing short, URL-safe filenames for temporary scripts.
 * 
 * @param input The raw string to be hashed
 * @returns {string} The resulting Hex string
 */
export function generateHash(input: string): string {
  // We use md5 because it is fast and we do not need cryptographically 
  // secure hashing for temporary file naming.
  return crypto.createHash('md5').update(input).digest('hex');
}
