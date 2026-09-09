export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const extractIndianSubscriberDigits = (phone?: string | null): string => {
  if (!phone) return '';
  let str = phone.trim();

  // Strip duplicate +91 / 91 prefixes and symbols
  if (/^\+?91[\s\-\+]/.test(str) || str.startsWith('+91') || str.startsWith('91 ') || str.startsWith('91-')) {
    str = str.replace(/^(\+?91[\s\-\+]*)+/, '');
  }

  // Remove any remaining non-digits
  let digits = str.replace(/[^\d]/g, '');

  // If there's a leading 0 (trunk prefix) and total is 11 digits, strip the 0
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // If digits start with 91 and total length is > 10, repeatedly strip country code 91
  while (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }

  return digits;
};

export const isValidIndianMobile = (phone?: string | null): boolean => {
  const digits = extractIndianSubscriberDigits(phone);
  // Valid Indian mobile numbers are strictly 10 digits starting with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(digits);
};

export const canonicalPhone = (phone?: string | null): string => {
  const digits = extractIndianSubscriberDigits(phone);
  return digits ? `+91${digits}` : '';
};

export const formatPhoneDisplay = (phone?: string | null): string => {
  const digits = extractIndianSubscriberDigits(phone);
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return digits ? `+91 ${digits}` : '';
};

export const normalizePhone = (phone?: string | null): string => {
  const digits = extractIndianSubscriberDigits(phone);
  return digits ? `+91${digits}` : '';
};


