/**
 * Safe, robust clipboard helper with multi-tier fallbacks.
 * Ensures clean, plain-text copying (one item per line) without browser blocking.
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern navigator.clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard failed, attempting fallback:', err);
    }
  }

  // 2. Fallback: offscreen textarea with document.execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.error('[Clipboard] execCommand fallback failed:', fallbackErr);
    return false;
  }
}

/**
 * Format keywords exactly one per line, no bullets, no quotes.
 */
export function formatKeywordsForScraper(keywords: string[]): string {
  return keywords
    .map((k) => k.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Format locations exactly one per line, e.g. "City, Country".
 */
export function formatLocationsForScraper(locations: { city: string; country?: string }[]): string {
  return locations
    .map((loc) => {
      const city = loc.city.trim();
      const country = loc.country?.trim();
      return country ? `${city}, ${country}` : city;
    })
    .filter(Boolean)
    .join('\n');
}