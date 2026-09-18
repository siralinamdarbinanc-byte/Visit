/**
 * Persian language utilities for normalizing text, searching, formatting dates and digits.
 */

const ARABIC_TO_PERSIAN_MAP: Record<string, string> = {
  'ي': 'ی',
  'ى': 'ی',
  'ئ': 'ی',
  'ك': 'ک',
  'ة': 'ه',
  'ؤ': 'و',
  'إ': 'ا',
  'أ': 'ا',
  'آ': 'ا',
  'ء': '',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '\u200C': ' ', // Zero-width non-joiner replaced with space for search normalization
};

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Normalizes Persian/Arabic text for searching:
 * - Replaces Arabic characters with Persian equivalents (ی, ک)
 * - Converts Arabic and Persian digits to standard ASCII digits
 * - Removes diacritics / vocalization
 * - Trims and normalizes whitespace
 */
export function normalizePersianText(input: string | undefined | null): string {
  if (!input) return '';
  let str = input.toLowerCase();

  // Normalize characters
  str = str.replace(/[يىئكةؤإأآء٠-٩۰-۹\u200C]/g, (ch) => ARABIC_TO_PERSIAN_MAP[ch] ?? ch);

  // Remove Persian/Arabic vowels & diacritics (َ ِ ُ ً ٍ ٌ ّ ْ)
  str = str.replace(/[\u064B-\u065F\u0670]/g, '');

  // Normalize multiple spaces
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Converts English digits to Persian digits for display
 */
export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '۰';
  const str = String(num);
  return str.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)]);
}

/**
 * Converts Persian/Arabic digits to ASCII English digits
 */
export function toEnglishDigits(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Normalizes phone numbers to standard format (e.g. 09123456789)
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = toEnglishDigits(phone).replace(/\D/g, '');
  if (digits.startsWith('98') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  return digits;
}

/**
 * Validates a mobile number (09xx)
 */
export function isValidIranianMobile(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^09\d{9}$/.test(normalized);
}

/**
 * Formats distance in meters or kilometers with Persian digits
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${toPersianDigits(Math.round(meters))} متر`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${toPersianDigits(km)} ک.م`;
}

/**
 * Formats date into Persian Solar Hijri calendar string (e.g. ۱۴۰۳/۰۶/۲۸)
 */
export function getPersianDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch (e) {
    // Fallback if Intl is restricted
    const y = date.getFullYear() - 621;
    return `${toPersianDigits(y)}/۰۶/۲۸`;
  }
}

/**
 * Formats time into Persian digits (e.g. ۱۱:۴۵)
 */
export function getPersianTimeString(date: Date = new Date()): string {
  try {
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return toPersianDigits(`${h}:${m}`);
  }
}

/**
 * Formats full timestamp with Persian digits
 */
export function getPersianFullDateTime(date: Date = new Date()): string {
  return `${getPersianDateString(date)} ساعت ${getPersianTimeString(date)}`;
}
