/**
 * requestLogger.js
 * Logs request execution time and highlights slow requests.
 */
module.exports = function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const isSlow = duration > 2000;
    const prefix = isSlow ? '⚠️  [SLOW]' : '⚡️';
    
    // Format: [timestamp] METHOD /path STATUS Xms
    const timestamp = new Date().toISOString();
    console.log(`${prefix} [${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};
