/**
 * MetricCard — KPI card used in Dashboard. Golden Parchment palette.
 */
export default function MetricCard({ icon: Icon, value, label, loading = false }) {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <div
          className="flex items-center justify-center"
          style={{ width: 40, height: 40, borderRadius: 10, background: '#F5EDD8' }}
        >
          {Icon && <Icon size={20} style={{ color: '#C49A3C' }} />}
        </div>
      </div>
      {loading ? (
        <>
          <div className="skeleton h-8 w-20 mb-2" />
          <div className="skeleton h-4 w-32" />
        </>
      ) : (
        <>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#2C2416', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {value ?? '—'}
          </div>
          <div style={{ fontSize: 13, color: '#9B8B70', fontWeight: 500, marginTop: 6 }}>
            {label}
          </div>
        </>
      )}
    </div>
  );
}
