import bcrypt from 'bcrypt';

/**
 * Hashes a string value using bcrypt
 * @param {string} value - The plain text value to hash (e.g., password)
 * @param {number} [saltRounds=10] - The cost factor for hashing (higher = more secure but slower)
 * @returns {Promise<string>} The hashed value
 * @example
 * const hashedPassword = await hashValue('myPassword123');
 * // returns '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
 *
 * const hashedWithCustomRounds = await hashValue('myPassword123', 12);
 * // returns hashed value with 12 salt rounds (more secure)
 */
export const hashValue = async (
  value: string,
  saltRounds: number = 10,
): Promise<string> => await bcrypt.hash(value, saltRounds);

/**
 * Compares a plain text value with a hashed value using bcrypt
 * @param {string} value - The plain text value to compare (e.g., user's input password)
 * @param {string} hashedValue - The hashed value to compare against (e.g., stored password hash)
 * @returns {Promise<boolean>} True if the values match, false otherwise
 * @example
 * const isValid = await compareValue('myPassword123', hashedPasswordFromDB);
 * if (isValid) {
 *   console.log('Password is correct!');
 * } else {
 *   console.log('Invalid password');
 * }
 */
export const compareValue = async (
  value: string,
  hashedValue: string,
): Promise<boolean> => await bcrypt.compare(value, hashedValue);
