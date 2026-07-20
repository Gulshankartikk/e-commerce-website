/** Wrap an async route handler so rejections flow to the global error middleware. */
export default (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
