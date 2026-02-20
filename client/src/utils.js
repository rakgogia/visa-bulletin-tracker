export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'just now';
}

export function formatLastUpdated(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Returns the label pair for the two cards based on comparison mode.
 * e.g. { first: { label, badgeClass }, second: { label, badgeClass } }
 */
export function getCardLabels(comparisonMode) {
  const isPrev = comparisonMode === 'previous-to-current';
  return {
    first: {
      label: isPrev ? 'Previous' : 'Current',
      badgeClass: isPrev ? 'badge badge-previous' : 'badge badge-current'
    },
    second: {
      label: isPrev ? 'Current' : 'Upcoming',
      badgeClass: isPrev ? 'badge badge-current' : 'badge badge-upcoming'
    }
  };
}
