import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import {
  loginRateLimit,
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
} from '../../../middleware/rate-limits.js';
import {
  loginValidation,
  logoutValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from '../validations/auth.validation.js';
import {
  loginController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
} from '../controller/auth.controller.js';

const router = Router();

router.post('/login', loginRateLimit, loginValidation, loginController);
router.post('/logout', logoutValidation, attachUserIfLoggedIn, logoutController);
router.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  forgotPasswordValidation,
  forgotPasswordController,
);
router.post(
  '/reset-password',
  resetPasswordRateLimit,
  resetPasswordValidation,
  resetPasswordController,
);

function attachUserIfLoggedIn(req, res, next) {
  authenticate(req, res, () => next());
}

export default router;
