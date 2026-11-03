// Wraps an async route handler so a thrown error reaches the error handler.
// Express 4 does not catch rejected promises on its own.
export function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };
}
