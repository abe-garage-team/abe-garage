import { UnauthorizedError, ForbiddenError } from '../utils/errors/index.js';

export function hasRole(...allowedRoleIds) {
  return function checkRole(req, res, next) {
    if (!req.user) return next(new UnauthorizedError('Authentication required'));
    if (!allowedRoleIds.includes(req.user.role_id)) {
      return next(new ForbiddenError('Access denied'));
    }
    next();
  };
}
