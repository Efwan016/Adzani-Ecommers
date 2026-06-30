export function normalizeIndonesianPhone(input?: string | null) {
  const cleaned = input?.trim().replace(/[^\d+]/g, '') ?? '';

  if (!cleaned) return '';
  if (cleaned.startsWith('+62')) return cleaned.slice(1).replace(/\+/g, '');
  if (cleaned.startsWith('08')) return `62${cleaned.slice(1)}`.replace(/\+/g, '');
  if (cleaned.startsWith('62')) return cleaned.replace(/\+/g, '');
  if (cleaned.startsWith('+')) return cleaned.slice(1).replace(/\+/g, '');

  return cleaned.replace(/\+/g, '');
}

export function formatPhoneDisplay(input?: string | null) {
  const normalized = normalizeIndonesianPhone(input);

  if (!normalized) return '';
  if (normalized.startsWith('62')) return `+${normalized}`;

  return normalized;
}

export function getWhatsAppChatUrl(input?: string | null) {
  const normalized = normalizeIndonesianPhone(input);

  if (!normalized) return null;

  return `https://wa.me/${normalized}`;
}
