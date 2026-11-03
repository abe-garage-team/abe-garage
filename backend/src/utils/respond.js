// Every successful response has the same shape: { status: 'success', message, data }.
export function respond(res, data = null, message = 'Request successful', statusCode = 200) {
  return res.status(statusCode).json({ status: 'success', message, data });
}
