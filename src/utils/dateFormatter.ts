/**
 * Converts PDF date format (D:YYYYMMDDHHmmSSZ) to a readable format
 * @param pdfDate PDF date string in format D:YYYYMMDDHHmmSSZ
 * @returns Formatted date string in IST
 */
export function formatPDFDate(pdfDate: string): string {
  if (!pdfDate) return '';
  
  // Remove the 'D:' prefix if it exists
  const cleanDate = pdfDate.startsWith('D:') ? pdfDate.slice(2) : pdfDate;
  
  try {
    const year = cleanDate.slice(0, 4);
    const month = cleanDate.slice(4, 6);
    const day = cleanDate.slice(6, 8);
    const hour = cleanDate.slice(8, 10);
    const minute = cleanDate.slice(10, 12);
    const second = cleanDate.slice(12, 14);
    
    // Create UTC date
    const utcDate = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1, // Months are 0-based in JS
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    ));
    
    // Convert to IST (UTC+5:30)
    utcDate.setMinutes(utcDate.getMinutes() + 330); // Add 5 hours and 30 minutes
    
    // Format the date
    return utcDate.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch (e) {
    console.warn('Failed to parse PDF date:', pdfDate);
    return pdfDate; // Return original if parsing fails
  }
}

/**
 * Format a date for upload timestamp
 * @param date Date to format
 * @returns Formatted date string with relative time if recent
 */
export function formatUploadDate(date: string | Date): string {
  const uploadDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInHours = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    // For today's uploads
    if (diffInHours < 1) {
      return 'Just now';
    }
    return `${Math.floor(diffInHours)} hours ago`;
  } else if (diffInHours < 48) {
    // For yesterday's uploads
    return 'Yesterday';
  }
  
  // For older uploads
  return uploadDate.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}