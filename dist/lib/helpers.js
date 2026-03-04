"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserAgent = exports.getLocationDetailsFromIP = exports.getLocationFromIP = exports.formatTimestamp24Hour = exports.formatLocalTimestamp = exports.calculateExpirationDate = exports.getOneWeekFromNow = exports.getClientIp = void 0;
exports.generateUniqueCode = generateUniqueCode;
const date_fns_1 = require("date-fns");
const uuid_1 = require("uuid");
const normalizeIPv4 = (ip) => {
    if (ip === '::1')
        return '127.0.0.1';
    if (ip.startsWith('::ffff:'))
        return ip.replace('::ffff:', '');
    return ip;
};
const getClientIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
        return normalizeIPv4(forwardedFor.split(',')[0].trim());
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
        return normalizeIPv4(forwardedFor[0]);
    }
    if (req.ip) {
        return normalizeIPv4(req.ip);
    }
    return '127.0.0.1';
};
exports.getClientIp = getClientIp;
const getOneWeekFromNow = () => {
    const now = new Date();
    return (0, date_fns_1.addWeeks)(now, 1);
};
exports.getOneWeekFromNow = getOneWeekFromNow;
const calculateExpirationDate = (expiresIn = '15m') => {
    const match = expiresIn.match(/^(\d+)([mhd])$/);
    if (!match)
        throw new Error('Invalid format. Use "15m", "1h", or "2d".');
    const [, value, unit] = match;
    const expirationDate = new Date();
    switch (unit) {
        case 'm':
            return (0, date_fns_1.add)(expirationDate, { minutes: parseInt(value) });
        case 'h':
            return (0, date_fns_1.add)(expirationDate, { hours: parseInt(value) });
        case 'd':
            return (0, date_fns_1.add)(expirationDate, { days: parseInt(value) });
        default:
            throw new Error('Invalid unit. Use "m", "h", or "d".');
    }
};
exports.calculateExpirationDate = calculateExpirationDate;
function generateUniqueCode() {
    return (0, uuid_1.v4)().replace(/-/g, '').substring(0, 25);
}
const formatLocalTimestamp = (date = new Date()) => {
    const timezoneOffset = -date.getTimezoneOffset() / 60;
    const timezoneString = `GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;
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
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${month} ${day}, ${year} at ${hoursStr}:${minutes}:${seconds} ${ampm} (${timezoneString})`;
};
exports.formatLocalTimestamp = formatLocalTimestamp;
const formatTimestamp24Hour = (date = new Date()) => {
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
exports.formatTimestamp24Hour = formatTimestamp24Hour;
const getLocationFromIP = (ipAddress) => __awaiter(void 0, void 0, void 0, function* () {
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
        return 'Local Network';
    }
    try {
        const response = yield fetch(`http://ip-api.com/json/${ipAddress}`);
        const data = yield response.json();
        if (data.status === 'success') {
            const parts = [data.city, data.regionName, data.country].filter(Boolean);
            return parts.join(', ') || 'Unknown Location';
        }
        return 'Unknown Location';
    }
    catch (error) {
        console.error('Error fetching location from IP:', error);
        return 'Unknown Location';
    }
});
exports.getLocationFromIP = getLocationFromIP;
const getLocationDetailsFromIP = (ipAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
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
        const response = yield fetch(`http://ip-api.com/json/${ipAddress}`);
        const data = yield response.json();
        if (data.status === 'success') {
            const parts = [data.city, data.regionName, data.country].filter(Boolean);
            return {
                city: (_a = data.city) !== null && _a !== void 0 ? _a : null,
                region: (_b = data.regionName) !== null && _b !== void 0 ? _b : null,
                country: (_c = data.country) !== null && _c !== void 0 ? _c : null,
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
    }
    catch (_d) {
        return {
            city: null,
            region: null,
            country: null,
            lat: null,
            lon: null,
            label: 'Unknown Location',
        };
    }
});
exports.getLocationDetailsFromIP = getLocationDetailsFromIP;
const parseUserAgent = (userAgent) => {
    if (!userAgent) {
        return 'Unknown Device';
    }
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browser = 'Chrome';
    }
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
    }
    else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
    }
    else if (userAgent.includes('Edg')) {
        browser = 'Edge';
    }
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        browser = 'Opera';
    }
    if (userAgent.includes('Windows NT 10.0')) {
        os = 'Windows 10';
    }
    else if (userAgent.includes('Windows NT 6.3')) {
        os = 'Windows 8.1';
    }
    else if (userAgent.includes('Windows NT 6.2')) {
        os = 'Windows 8';
    }
    else if (userAgent.includes('Windows NT 6.1')) {
        os = 'Windows 7';
    }
    else if (userAgent.includes('Windows')) {
        os = 'Windows';
    }
    else if (userAgent.includes('Mac OS X')) {
        const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
        os = match ? `Mac OS X ${match[1].replace('_', '.')}` : 'Mac OS X';
    }
    else if (userAgent.includes('Linux')) {
        os = 'Linux';
    }
    else if (userAgent.includes('Android')) {
        os = 'Android';
    }
    else if (userAgent.includes('iOS') ||
        userAgent.includes('iPhone') ||
        userAgent.includes('iPad')) {
        os = 'iOS';
    }
    return `${browser} on ${os}`;
};
exports.parseUserAgent = parseUserAgent;
