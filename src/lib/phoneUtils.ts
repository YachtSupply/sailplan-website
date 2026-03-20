/**
 * Phone number formatting utilities.
 *
 * Converts any US phone string to:
 *   display: "(555) 555-5555"
 *   href:    "tel:+15555555555"
 */

export interface FormattedPhone {
  display: string;
  href: string;
}

export function formatPhone(raw: string | null | undefined): FormattedPhone | null {
  if (!raw) return null;

  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');

  // Accept 10-digit (US local) or 11-digit starting with 1 (US with country code)
  let local: string;
  if (digits.length === 11 && digits.startsWith('1')) {
    local = digits.slice(1);
  } else if (digits.length === 10) {
    local = digits;
  } else {
    // Cannot normalize — return a best-effort display
    return { display: raw, href: `tel:${raw}` };
  }

  const area = local.slice(0, 3);
  const exchange = local.slice(3, 6);
  const subscriber = local.slice(6, 10);

  return {
    display: `(${area}) ${exchange}-${subscriber}`,
    href: `tel:+1${local}`,
  };
}
