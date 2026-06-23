const rateCache = new Map();

/**
 * Basic in-memory rate limiter for Netlify Functions.
 * Note: This only limits requests per function instance. 
 * @param {Object} event The Netlify function event
 * @param {number} maxRequests Maximum requests allowed within the window
 * @param {number} windowMs Time window in milliseconds
 * @throws Error if rate limit is exceeded
 */
const rateLimit = (event, maxRequests = 60, windowMs = 60000) => {
    // Get client IP from Netlify headers
    const ip = event.headers['x-nf-client-connection-ip'] || 
               event.headers['client-ip'] || 
               event.headers['x-forwarded-for'] || 
               'unknown';

    if (ip === 'unknown') return; // Skip if we can't determine IP

    const now = Date.now();
    const record = rateCache.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
        // Reset window
        record.count = 1;
        record.resetTime = now + windowMs;
    } else {
        record.count++;
        if (record.count > maxRequests) {
            throw new Error(`Rate limit exceeded. Try again later.`);
        }
    }

    rateCache.set(ip, record);

    // Optional cleanup to prevent memory leaks in long-running instances
    if (rateCache.size > 10000) {
        const cleanupTime = now - windowMs;
        for (const [key, val] of rateCache.entries()) {
            if (val.resetTime < cleanupTime) rateCache.delete(key);
        }
    }
};

module.exports = { rateLimit };
