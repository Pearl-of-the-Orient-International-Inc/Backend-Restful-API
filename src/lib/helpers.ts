/**
 * Node Modules
 */
import { add, addWeeks } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

/**
 * Types
 */
import type { Request } from 'express';

/**
 * Normalizes IPv6 addresses to IPv4 format
 * @param {string} ip - The IP address to normalize
 * @returns {string} Normalized IPv4 address
 * @example
 * normalizeIPv4('::1') // returns '127.0.0.1'
 * normalizeIPv4('::ffff:192.168.1.1') // returns '192.168.1.1'
 */
const normalizeIPv4 = (ip: string): string => {
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
};

/**
 * Extracts the client's IP address from an Express request
 * Checks x-forwarded-for header first, then falls back to req.ip
 * @param {Request} req - Express request object
 * @returns {string} Client's IPv4 address
 * @example
 * const clientIp = getClientIp(req);
 * // returns '192.168.1.100'
 */
export const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return normalizeIPv4(forwardedFor.split(',')[0].trim());
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return normalizeIPv4(forwardedFor[0]);
  }

  // Express fallback
  if (req.ip) {
    return normalizeIPv4(req.ip);
  }

  return '127.0.0.1';
};

/**
 * Returns a Date object for 1 week from now
 * @returns {Date} Date object representing 1 week from now
 * @example
 * const futureDate = getOneWeekFromNow();
 * // returns Date object 7 days in the future
 */
export const getOneWeekFromNow = (): Date => {
  const now = new Date();
  return addWeeks(now, 1);
};

/**
 * Calculates an expiration date based on a time string
 * @param {string} [expiresIn='15m'] - Time string in format: number + unit (m=minutes, h=hours, d=days)
 * @returns {Date} Expiration date
 * @throws {Error} If format is invalid or unit is not recognized
 * @example
 * calculateExpirationDate('15m') // 15 minutes from now
 * calculateExpirationDate('2h')  // 2 hours from now
 * calculateExpirationDate('7d')  // 7 days from now
 */
export const calculateExpirationDate = (expiresIn: string = '15m'): Date => {
  // Match number + unit (m = minutes, h = hours, d = days)
  const match = expiresIn.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error('Invalid format. Use "15m", "1h", or "2d".');
  const [, value, unit] = match;
  const expirationDate = new Date();

  // Check the unit and apply accordingly
  switch (unit) {
    case 'm': // minutes
      return add(expirationDate, { minutes: parseInt(value) });
    case 'h': // hours
      return add(expirationDate, { hours: parseInt(value) });
    case 'd': // days
      return add(expirationDate, { days: parseInt(value) });
    default:
      throw new Error('Invalid unit. Use "m", "h", or "d".');
  }
};

/**
 * Generates a unique 25-character code using UUID v4
 * @returns {string} A unique 25-character alphanumeric code
 * @example
 * const code = generateUniqueCode();
 * // returns '7f3d8a9b2c1e4f5a6b7c8d9e0'
 */
export function generateUniqueCode() {
  return uuidv4().replace(/-/g, '').substring(0, 25);
}

/**
 * Formats a timestamp in local time with timezone information
 * User-friendly format suitable for login notifications and user-facing displays
 * @param {Date} [date=new Date()] - The date to format (defaults to current date/time)
 * @returns {string} Formatted timestamp string
 * @example
 * formatLocalTimestamp()
 * // returns 'February 03, 2026 at 11:17:58 AM (GMT+8)'
 *
 * formatLocalTimestamp(new Date('2026-01-15T14:30:00'))
 * // returns 'January 15, 2026 at 02:30:00 PM (GMT+8)'
 */
export const formatLocalTimestamp = (date: Date = new Date()): string => {
  // Get timezone offset in hours
  const timezoneOffset = -date.getTimezoneOffset() / 60;
  const timezoneString = `GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;

  // Format date parts
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  // Format time with AM/PM
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hoursStr = String(hours).padStart(2, '0');

  return `${month} ${day}, ${year} at ${hoursStr}:${minutes}:${seconds} ${ampm} (${timezoneString})`;
};

/**
 * Formats a timestamp in 24-hour format with timezone information
 * ISO-like format suitable for logs and technical displays
 * @param {Date} [date=new Date()] - The date to format (defaults to current date/time)
 * @returns {string} Formatted timestamp string in 24-hour format
 * @example
 * formatTimestamp24Hour()
 * // returns '2026-02-03 11:17:58 (GMT+8)'
 *
 * formatTimestamp24Hour(new Date('2026-01-15T14:30:00'))
 * // returns '2026-01-15 14:30:00 (GMT+8)'
 */
export const formatTimestamp24Hour = (date: Date = new Date()): string => {
  // Get timezone offset in hours
  const timezoneOffset = -date.getTimezoneOffset() / 60;
  const timezoneString = `GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (${timezoneString})`;
};

/**
 * Gets approximate location from IP address using ip-api.com (free, no API key required)
 * @param {string | null} ipAddress - The IP address to lookup
 * @returns {Promise<string>} Formatted location string
 * @example
 * const location = await getLocationFromIP('8.8.8.8');
 * // returns 'Mountain View, California, United States'
 *
 * const local = await getLocationFromIP('127.0.0.1');
 * // returns 'Local Network'
 */
export const getLocationFromIP = async (
  ipAddress: string | null,
): Promise<string> => {
  if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
    return 'Local Network';
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
    const data = await response.json();

    if (data.status === 'success') {
      const parts = [data.city, data.regionName, data.country].filter(Boolean);
      return parts.join(', ') || 'Unknown Location';
    }

    return 'Unknown Location';
  } catch (error) {
    console.error('Error fetching location from IP:', error);
    return 'Unknown Location';
  }
};

export interface IpLocationDetails {
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  label: string;
}

/**
 * Gets structured location details from IP address using ip-api.com
 * @param {string | null} ipAddress - The IP address to lookup
 * @returns {Promise<IpLocationDetails>} Structured location object
 */
export const getLocationDetailsFromIP = async (
  ipAddress: string | null,
): Promise<IpLocationDetails> => {
  if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
    return {
      city: null,
      region: null,
      country: null,
      lat: null,
      lon: null,
      label: 'Local Network',
    };
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
    const data = await response.json();

    if (data.status === 'success') {
      const parts = [data.city, data.regionName, data.country].filter(Boolean);
      return {
        city: data.city ?? null,
        region: data.regionName ?? null,
        country: data.country ?? null,
        lat: typeof data.lat === 'number' ? data.lat : null,
        lon: typeof data.lon === 'number' ? data.lon : null,
        label: parts.join(', ') || 'Unknown Location',
      };
    }

    return {
      city: null,
      region: null,
      country: null,
      lat: null,
      lon: null,
      label: 'Unknown Location',
    };
  } catch {
    return {
      city: null,
      region: null,
      country: null,
      lat: null,
      lon: null,
      label: 'Unknown Location',
    };
  }
};

/**
 * Parses user agent string to extract readable device and browser information
 * @param {string | null} userAgent - The user agent string from request headers
 * @returns {string} Formatted string describing browser and operating system
 * @example
 * const device = parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...');
 * // returns 'Chrome on Mac OS X 10.15.7'
 *
 * const mobile = parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)...');
 * // returns 'Safari on iOS'
 */
export const parseUserAgent = (userAgent: string | null): string => {
  if (!userAgent) {
    return 'Unknown Device';
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect Browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  if (userAgent.includes('Windows NT 10.0')) {
    os = 'Windows 10';
  } else if (userAgent.includes('Windows NT 6.3')) {
    os = 'Windows 8.1';
  } else if (userAgent.includes('Windows NT 6.2')) {
    os = 'Windows 8';
  } else if (userAgent.includes('Windows NT 6.1')) {
    os = 'Windows 7';
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    os = match ? `Mac OS X ${match[1].replace('_', '.')}` : 'Mac OS X';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (
    userAgent.includes('iOS') ||
    userAgent.includes('iPhone') ||
    userAgent.includes('iPad')
  ) {
    os = 'iOS';
  }

  return `${browser} on ${os}`;
};
