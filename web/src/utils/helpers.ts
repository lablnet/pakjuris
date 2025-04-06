/**
 * Format a date string to a more readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formattedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // Today
  if (diffDay === 0) {
    if (diffHour === 0) {
      if (diffMin === 0) {
        return 'Just now';
      }
      return `${diffMin} min ago`;
    }
    return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  }
  
  // Yesterday
  if (diffDay === 1) {
    return 'Yesterday';
  }
  
  // Within a week
  if (diffDay < 7) {
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  }
  
  // More than a week
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  // If not current year, add year
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }
  
  return date.toLocaleDateString(undefined, options);
};
