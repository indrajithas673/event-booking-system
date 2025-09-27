/**
 * Escapes regex special characters to prevent ReDoS attacks.
 * Must be used on any user-supplied string before passing to `new RegExp()`.
 */
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = escapeRegex;
