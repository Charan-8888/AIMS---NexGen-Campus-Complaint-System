import { clsx } from 'clsx';

/**
 * StatusBadge — renders a colored badge for complaint status or priority.
 *
 * Usage:
 *   <StatusBadge type="status" value="IN_PROGRESS" />
 *   <StatusBadge type="priority" value="CRITICAL" />
 */

const STATUS_LABELS = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  RESOLVED: 'Resolved',
  VERIFIED: 'Verified',
  REOPENED: 'Reopened',
  CANCELLED: 'Cancelled',
};

const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const StatusBadge = ({ type = 'status', value, className }) => {
  const key = value?.toLowerCase().replace('_', '_');
  const label =
    type === 'priority'
      ? PRIORITY_LABELS[value] || value
      : STATUS_LABELS[value] || value;

  const badgeClass =
    type === 'priority'
      ? `badge badge-${value?.toLowerCase()}`
      : `badge badge-${value?.toLowerCase().replace('_', '_')}`;

  return (
    <span className={clsx(badgeClass, className)}>
      {type === 'priority' && (
        <span className={`priority-dot ${value?.toLowerCase()}`} />
      )}
      {label}
    </span>
  );
};

export default StatusBadge;
