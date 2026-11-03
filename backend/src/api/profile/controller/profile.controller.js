import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';
import { getProfileService } from '../service/profile.service.js';

export const getProfileController = asyncHandler(async (req, res) => {
  const profile = await getProfileService(req.user.employee_id);
  res.set('Cache-Control', 'no-store');
  return respond(res, profile, 'Get own staff profile successful');
});
