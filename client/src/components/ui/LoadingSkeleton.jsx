/**
 * LoadingSkeleton — animated shimmer placeholder.
 */
export default function LoadingSkeleton({ width = '100%', height = 16, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}
