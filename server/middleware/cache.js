/**
 * cache.js
 * Simple in-memory response caching middleware using a Map.
 */
const cache = new Map();

module.exports = function cacheMiddleware(ttlSeconds) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse.data);
    }

    // Intercept res.json to store the response
    const originalJson = res.json;
    res.json = function (body) {
      // Store in cache
      cache.set(key, {
        data: body,
        expiry: Date.now() + ttlSeconds * 1000,
      });

      res.setHeader('X-Cache', 'MISS');
      // Call original json method
      originalJson.call(this, body);
    };

    next();
  };
};
