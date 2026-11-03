import { asyncHandler } from '../utils/async-handler.js';
import { UnauthorizedError, ForbiddenError, ERROR_CODES } from '../utils/errors/index.js';
import {
  readSessionTokenFromRequest,
  setSessionCookie,
  clearSessionCookie,
  hasSessionCookie,
} from '../shared/sessions/session.cookie.js';
import {
  findLiveSessionByToken,
  extendSession,
  touchSession,
} from '../shared/sessions/session.store.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = readSessionTokenFromRequest(req);

  if (!token) {
    if (hasSessionCookie(req)) clearSessionCookie(res);
    throw new UnauthorizedError('Authentication required');
  }

  const session = await findLiveSessionByToken(token);
  if (!session) {
    clearSessionCookie(res);
    throw new UnauthorizedError('Your session has expired. Please log in again.', {
      code: ERROR_CODES.SESSION_EXPIRED,
    });
  }

  if (!session.active) {
    clearSessionCookie(res);
    throw new ForbiddenError('Account disabled', { code: ERROR_CODES.ACCOUNT_DISABLED });
  }

  if (session.needs_extension) {
    const newExpiresAt = await extendSession(session.session_id);
    setSessionCookie(res, token, newExpiresAt);
  } else {
    await touchSession(session.session_id);
  }

  req.user = {
    employee_id: session.employee_id,
    role_id: session.role_id,
    session_id: session.session_id,
  };
  next();
});
