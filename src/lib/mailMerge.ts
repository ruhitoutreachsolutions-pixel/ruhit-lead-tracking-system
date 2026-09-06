import { Lead } from '../types';

/**
 * Converts selected leads into exactly 4-column Tab-Separated Values (TSV)
 * Output Header: Email\tFirst Name\tLast Name\tCompany Name
 * Compatible directly with Google Sheets paste.
 */
export function generateMailMergeTSV(leads: Lead[], includeHeader: boolean = true): string {
  const rows: string[] = [];

  if (includeHeader) {
    rows.push(['Email', 'First Name', 'Last Name', 'Company Name'].join('\t'));
  }

  for (const lead of leads) {
    const email = (lead.email || '').replace(/[\t\r\n]/g, ' ').trim();
    const firstName = (lead.first_name || '').replace(/[\t\r\n]/g, ' ').trim();
    const lastName = (lead.last_name || '').replace(/[\t\r\n]/g, ' ').trim();
    const company = (lead.company_name || '').replace(/[\t\r\n]/g, ' ').trim();

    rows.push([email, firstName, lastName, company].join('\t'));
  }

  return rows.join('\r\n');
}

/**
 * Copies the TSV text to the system clipboard
 */
export async function copyMailMergeToClipboard(leads: Lead[], includeHeader: boolean = true): Promise<boolean> {
  const tsv = generateMailMergeTSV(leads, includeHeader);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(tsv);
      return true;
    } else {
      // Fallback textarea approach
      const textarea = document.createElement('textarea');
      textarea.value = tsv;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (err) {
    console.error('Failed to copy mail merge to clipboard:', err);
    return false;
  }
}
