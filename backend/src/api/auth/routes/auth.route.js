import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { loginRateLimit } from '../../../middleware/rate-limits.js';
import { loginValidation, logoutValidation } from '../validations/auth.validation.js';
import { loginController, logoutController } from '../controller/auth.controller.js';

const router = Router();

router.post('/login', loginRateLimit, loginValidation, loginController);
router.post('/logout', logoutValidation, attachUserIfLoggedIn, logoutController);

function attachUserIfLoggedIn(req, res, next) {
  authenticate(req, res, () => next());
}

export default router;
