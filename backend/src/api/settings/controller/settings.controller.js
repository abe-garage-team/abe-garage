import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';
import { listRolesService, getSettingsService } from '../service/settings.service.js';

export const listRolesController = asyncHandler(async (req, res) => {
  const roles = await listRolesService();
  return respond(res, { roles }, 'List fixed staff roles successful');
});

export const getSettingsController = asyncHandler(async (req, res) => {
  const settings = await getSettingsService();
  return respond(res, settings, 'Read garage settings successful');
});
