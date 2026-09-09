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

export const normalizePhone = (phone?: string | null): string => {
  if (!phone) return '';
  let str = phone.trim();
  // If string starts with +91 or 91 with separator or duplicated prefixes, strip repeated prefixes
  if (/^\+?91[\s\-\+]/.test(str) || str.startsWith('+91') || str.startsWith('91 ')) {
    let rest = str.replace(/^(\+?91[\s\-\+]*)+/, '').replace(/[^\d]/g, '');
    if (rest) return `+91 ${rest}`;
  }
  let digits = str.replace(/[^\d]/g, '');
  while (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }
  return digits ? `+91 ${digits}` : '';
};

