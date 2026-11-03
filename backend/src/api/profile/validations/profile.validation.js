import { rejectRequestBody, rejectUnknownQueryFields } from '../../../middleware/validators.js';

export const getProfileValidation = [rejectRequestBody, rejectUnknownQueryFields([])];
