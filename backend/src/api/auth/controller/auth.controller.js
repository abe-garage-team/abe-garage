import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';
import { requestDetails } from '../../../shared/auth/auth-events.js';
import { setSessionCookie, clearSessionCookie } from '../../../shared/sessions/session.cookie.js';
import { loginService, logoutService } from '../service/auth.service.js';

export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await loginService({ email, password }, requestDetails(req));
  setSessionCookie(res, result.session.token, result.session.expiresAt);
  res.set('Cache-Control', 'no-store');
  return respond(res, { employee: result.employee }, 'Staff login successful');
});

export const logoutController = asyncHandler(async (req, res) => {
  if (req.user) await logoutService(req.user, requestDetails(req));
  clearSessionCookie(res);
  res.set('Cache-Control', 'no-store');
  return respond(res, null, 'Logged out');
});
