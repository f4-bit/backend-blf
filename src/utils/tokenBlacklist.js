import jwt from 'jsonwebtoken';

/**
 * Simple blacklist in memory.
 * Save tokens alongside with its expiry (ms timestamp).
 * When checking, cleans expired items.
 *
 * Note: is volatile (it is lost when the server is restarted).
 */

const blacklist = new Map();

/**
 * Add a token to  the blacklist. It tries to read his `exp` in order to
 * eliminate once it caducates.
 */
export const addToBlacklist = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
            const expiryMs = decoded.exp * 1000;
            blacklist.set(token, expiryMs);
        } else {
            // If they don't have experience (unlikely), we'll schedule them for 24 hours to be safe
            blacklist.set(token, Date.now() + 24 * 60 * 60 * 1000); 
        }
    } catch (err) {
        // if decode fails, the the save it in short TTL
        blacklist.set(token, Date.now() + 60 * 60 * 1000)
    }
};

/**
 * Checks if token is in the blacklist. It also cleans expired items.
 */
export const isBlacklisted = (token) => {
    // Clean expired items
    const now = Date.now();
    for (const[t, expMs] of blacklist.entries()){
        if (expMs <= now) blacklist.delete(t);
    }
    return blacklist.has(token);
};