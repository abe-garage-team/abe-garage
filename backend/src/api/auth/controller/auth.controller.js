import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';
import { requestDetails } from '../../../shared/auth/auth-events.js';
import { setSessionCookie, clearSessionCookie } from '../../../shared/sessions/session.cookie.js';
import {
  loginService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
} from '../service/auth.service.js';

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

export const forgotPasswordController = asyncHandler(async (req, res) => {
  await forgotPasswordService({ email: req.body.email }, requestDetails(req));
  return respond(res, null, 'If an eligible account exists, a password reset link will be sent.');
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const { token, new_password } = req.body;
  await resetPasswordService({ token, newPassword: new_password }, requestDetails(req));
  return respond(res, null, 'Password reset successfully. Please log in.');
});
