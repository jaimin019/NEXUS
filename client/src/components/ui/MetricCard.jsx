/**
 * MetricCard — KPI card used in Dashboard Row 1.
 */
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MetricCard({ icon: Icon, value, label, trend, trendValue, color = 'indigo', loading = false }) {
  const colorMap = {
    indigo: { icon: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    cyan: { icon: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    green: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    red: { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  };

  const c = colorMap[color] || colorMap.indigo;
  const isPositive = trend === 'up';

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 0 24px rgba(79,70,229,0.12)' }}
      transition={{ duration: 0.2 }}
      className="glass-card p-5 cursor-default group hover:glow-border transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${c.bg} border ${c.border}`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className="skeleton h-8 w-20 mb-2" />
          <div className="skeleton h-4 w-32" />
        </>
      ) : (
        <>
          <div className="gradient-text text-3xl font-bold mb-1">{value ?? '—'}</div>
          <div className="text-sm text-nexus-textMuted font-medium">{label}</div>
        </>
      )}
    </motion.div>
  );
}
