// Shared role theme definitions used by all dashboards and components
export const ROLE_THEMES = {
  PATIENT: {
    primary: '#0D9488',
    light: '#CCFBF1',
    lighter: '#F0FDFA',
    bg10: 'rgba(13,148,136,0.1)',
    label: 'Patient Portal',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
  },
  DOCTOR: {
    primary: '#7C3AED',
    light: '#EDE9FE',
    lighter: '#F5F3FF',
    bg10: 'rgba(124,58,237,0.1)',
    label: 'Doctor Portal',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
  },
  ADMIN: {
    primary: '#2563EB',
    light: '#DBEAFE',
    lighter: '#EFF6FF',
    bg10: 'rgba(37,99,235,0.1)',
    label: 'Admin Portal',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
  },
  PHARMACY: {
    primary: '#C026D3',
    light: '#FAE8FF',
    lighter: '#FDF4FF',
    bg10: 'rgba(192,38,211,0.1)',
    label: 'Pharmacy Portal',
    gradient: 'linear-gradient(135deg, #C026D3 0%, #A21CAF 100%)',
  },
  LAB: {
    primary: '#EA580C',
    light: '#FFEDD5',
    lighter: '#FFF7ED',
    bg10: 'rgba(234,88,12,0.1)',
    label: 'Lab Portal',
    gradient: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
  },
};

// Status badge helper
export function StatusBadge({ status }) {
  const map = {
    SCHEDULED:        { cls: 'badge-blue',    label: 'Scheduled' },
    CONFIRMED:        { cls: 'badge-success',  label: 'Confirmed' },
    COMPLETED:        { cls: 'badge-gray',     label: 'Completed' },
    CANCELLED:        { cls: 'badge-danger',   label: 'Cancelled' },
    PENDING:          { cls: 'badge-warning',  label: 'Pending' },
    PAID:             { cls: 'badge-success',  label: 'Paid' },
    ACTIVE:           { cls: 'badge-success',  label: 'Active' },
    PROCESSING:       { cls: 'badge-blue',     label: 'Processing' },
    REQUESTED:        { cls: 'badge-warning',  label: 'Requested' },
    SAMPLE_COLLECTED: { cls: 'badge-blue',     label: 'Collected' },
    SUFFICIENT:       { cls: 'badge-success',  label: 'In Stock' },
    LOW_STOCK:        { cls: 'badge-warning',  label: 'Low Stock' },
    OUT_OF_STOCK:     { cls: 'badge-danger',   label: 'Out of Stock' },
  };
  const info = map[status] || { cls: 'badge-gray', label: status };
  return <span className={info.cls}>{info.label}</span>;
}

// Stat card component
export function StatCard({ icon: Icon, label, value, theme, subtitle }) {
  return (
    <div className="stat-card flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: theme.bg10 }}
      >
        <Icon style={{ color: theme.primary, width: 22, height: 22 }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// Empty state
export function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 font-medium">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Loading skeleton rows
export function TableSkeleton({ rows = 3, cols = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="skeleton h-4 rounded" style={{ width: j === 0 ? '70%' : '50%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-4 rounded w-2/3" />
      <div className="skeleton h-3 rounded w-full" />
      <div className="skeleton h-3 rounded w-4/5" />
    </div>
  );
}
