type Status = 'pending' | 'success' | 'failure' | 'idle';

const LABELS: Record<Status, string> = {
  idle: 'Not sent',
  pending: 'Working…',
  success: 'Success',
  failure: 'Failed',
};

export function StatusBadge({ status, error }: { status: Status; error?: string }) {
  return (
    <span className={`status-badge status-badge--${status}`} title={error}>
      {status === 'pending' && <span className="spinner" aria-hidden />}
      {status === 'success' && '✅ '}
      {status === 'failure' && '❌ '}
      {LABELS[status]}
    </span>
  );
}
