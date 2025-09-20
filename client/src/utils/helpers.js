/**
 * @param {string} name - Full name (e.g. "John Doe")
 * @returns {string} First two initials (e.g. "JD")
 */
export const getInitials = (name) => {
  if (!name) return '';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
};

/**
 * @param {string} text
 * @param {number} maxLength
 * @returns {string} Truncated text with "..." suffix
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Returns a Tailwind color class based on capacity fill percentage.
 * @param {number} percentage - 0–100
 * @returns {string} Tailwind color class
 */
export const getCapacityColor = (percentage) => {
  if (percentage >= 100) return 'text-red-600';
  if (percentage >= 80) return 'text-orange-500';
  if (percentage >= 50) return 'text-yellow-500';
  return 'text-green-500';
};

/**
 * @param {number} current - Current registrations
 * @param {number} total  - Total capacity
 * @returns {"available"|"filling"|"almost-full"|"full"}
 */
export const getCapacityStatus = (current, total) => {
  if (total === 0) return 'full';

  const percentage = (current / total) * 100;
  if (percentage >= 100) return 'full';
  if (percentage >= 80) return 'almost-full';
  if (percentage >= 50) return 'filling';
  return 'available';
};

/**
 * @param {string} location - Address or place name
 * @returns {string} Google Maps search URL
 */
export const generateGoogleMapsUrl = (location) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

/**
 * Generates a CSV string from data and triggers a browser download.
 * @param {Array<Object>} data
 * @param {string} filename - Without extension
 */
export const downloadCSV = (data, filename = 'export') => {
  if (!data?.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const cell = row[header] ?? '';
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * @param {string|Date} date
 * @returns {boolean} True if the event date is in the future
 */
export const isEventUpcoming = (date) => new Date(date) > new Date();

/**
 * @param {string|Date} date
 * @returns {boolean} True if the event date is in the past
 */
export const isEventPast = (date) => new Date(date) < new Date();
