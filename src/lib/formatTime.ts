/**
 * Time formatting utilities - ensures strict 12-hour AM/PM format across the system
 */

export function formatTo12Hour(timeStr: string | null | undefined): string {
  if (!timeStr) return '';

  // If already in 12hr format like "10:00 AM" or "02:30 PM"
  if (/\b(AM|PM|am|pm)\b/.test(timeStr)) {
    return timeStr.toUpperCase();
  }

  // If ISO string like "2026-09-01T14:30:00.000Z"
  if (timeStr.includes('T') || timeStr.includes('Z')) {
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch {
      // fallback
    }
  }

  // Standard military time "14:30" or "09:00" or "9:00:00"
  const parts = timeStr.trim().split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (isNaN(hours)) return timeStr;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const paddedMinutes = minutes.padStart(2, '0');
    return `${hours}:${paddedMinutes} ${ampm}`;
  }

  return timeStr;
}

export function formatDateFormatted(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
