import { NotFoundError } from '../utils/errors/index.js';

export function notFound(req, res, next) {
  next(new NotFoundError('Route not found'));
}
