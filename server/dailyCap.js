/**
 * In-memory daily generation cap (resets at UTC midnight).
 * Suitable for local dev / single-instance prototypes — use Redis or a DB in production.
 */

const buckets = new Map();

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function pruneStaleEntries() {
  const today = todayUtc();
  for (const [key, entry] of buckets.entries()) {
    if (entry.date !== today) buckets.delete(key);
  }
}

/** @param {number} maxPerDay 0 disables the cap */
function createDailyCapMiddleware(maxPerDay) {
  return (req, res, next) => {
    if (!maxPerDay || maxPerDay <= 0) return next();

    pruneStaleEntries();

    const key = clientKey(req);
    const today = todayUtc();
    let entry = buckets.get(key);

    if (!entry || entry.date !== today) {
      entry = { date: today, count: 0 };
      buckets.set(key, entry);
    }

    if (entry.count >= maxPerDay) {
      return res.status(429).json({
        error:
          "Daily generation limit reached. Try again tomorrow, or use Load sample for offline demos.",
        code: "DAILY_LIMIT",
      });
    }

    entry.count += 1;
    next();
  };
}

module.exports = { createDailyCapMiddleware, clientKey, todayUtc };
