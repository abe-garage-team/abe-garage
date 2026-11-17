import { body, query } from 'express-validator';
import { validationHandler } from '../../../middleware/validation-handler.js';
import {
  rejectUnknownBodyFields,
  rejectUnknownQueryFields,
  requireAtLeastOneBodyField,
  rejectRequestBody,
  positiveIdParam,
  paginationQueryFields,
  searchQueryField,
  queryBooleanField,
} from '../../../middleware/validators.js';

const MAX_NOTE_LENGTH = 2000;
const MONEY_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const HAS_TIMEZONE = /(Z|[+-]\d{2}:\d{2})$/i;

const serviceIdField = (fieldName) =>
  body(fieldName)
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Service ID must be a positive integer')
    .bail()
    .toInt();

const noteField = (fieldName, label, { allowNull = false } = {}) =>
  body(fieldName)
    .optional({ values: allowNull ? 'null' : 'undefined' })
    .isString()
    .withMessage(`${label} must be a string`)
    .bail()
    .trim()
    .isLength({ max: MAX_NOTE_LENGTH })
    .withMessage(`${label} must be at most ${MAX_NOTE_LENGTH} characters`);

export const createOrderValidation = [
  rejectUnknownBodyFields([
    'customer_id',
    'vehicle_id',
    'lines',
    'estimated_ready_date',
    'notes_for_customer',
    'internal_notes',
  ]),

  body('customer_id')
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Customer ID must be a positive integer'),

  body('vehicle_id')
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Vehicle ID must be a positive integer'),

  body('lines')
    .isArray({ min: 1, max: 100 })
    .withMessage('At least 1 and maximum 100 services are allowed')
    .bail()
    .custom((lines) => {
      for (const line of lines) {
        if (
          !line ||
          typeof line !== 'object' ||
          Array.isArray(line) ||
          !Object.hasOwn(line, 'service_id') ||
          Object.keys(line).some((key) => key !== 'service_id')
        ) {
          throw new Error('Each line must contain only service_id');
        }
      }

      const serviceIds = lines.map((line) => String(line.service_id));

      if (new Set(serviceIds).size !== lines.length) {
        throw new Error('Duplicate services are not allowed');
      }

      return true;
    }),

  body('lines.*.service_id')
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Service ID must be a positive integer'),

  body('estimated_ready_date')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Estimated ready date must be ISO 8601')
    .bail()
    .custom((value) => {
      // Require an explicit timezone: Z or ±HH:MM
      if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value)) {
        throw new Error('Estimated ready date must include a timezone');
      }

      if (new Date(value).getTime() <= Date.now()) {
        throw new Error('Estimated ready date must be in the future');
      }

      return true;
    }),

  noteField('notes_for_customer', 'Notes for customer'),
  noteField('internal_notes', 'Internal notes'),
  validationHandler,
];

export const listOrdersValidation = [
  rejectRequestBody,
  rejectUnknownQueryFields([
    'search',
    'status',
    'paid',
    'customer_id',
    'vehicle_id',
    'unpaid_only',
    'page',
    'limit',
  ]),
  searchQueryField(),

  query('status')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Status must be between 1 and 5')
    .bail()
    .toInt(),

  queryBooleanField('paid'),
  queryBooleanField('unpaid_only'),

  query('customer_id')
    .optional()
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Customer ID must be a positive integer')
    .bail()
    .toInt(),

  query('vehicle_id')
    .optional()
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Vehicle ID must be a positive integer')
    .bail()
    .toInt(),

  ...paginationQueryFields(),

  query().custom((_value, { req }) => {
    const unpaidOnly = req.query.unpaid_only === true || req.query.unpaid_only === 'true';

    if (!unpaidOnly) return true;

    if (req.query.paid === true || req.query.paid === 'true') {
      throw new Error('unpaid_only=true cannot be combined with paid=true');
    }

    if (req.query.status !== undefined && Number(req.query.status) !== 4) {
      throw new Error('unpaid_only=true requires status=4');
    }

    return true;
  }),
  validationHandler,
];

export const getOrderParamsValidation = [
  rejectRequestBody,
  positiveIdParam('order_id'),
  validationHandler,
];

export const updateOrderValidation = [
  positiveIdParam('order_id'),
  rejectUnknownBodyFields([
    'lines',
    'estimated_ready_date',
    'notes_for_customer',
    'internal_notes',
  ]),
  requireAtLeastOneBodyField,

  body('lines')
    .optional()
    .isArray({ min: 1, max: 100 })
    .withMessage('Lines must contain 1 to 100 services')
    .bail()
    .custom((lines) => {
      const ids = [];

      for (const line of lines) {
        if (!line || typeof line !== 'object' || Array.isArray(line)) {
          throw new Error('Each line must be an object');
        }

        const allowed = ['service_id', 'line_price'];

        if (Object.keys(line).some((key) => !allowed.includes(key))) {
          throw new Error('Unknown line fields');
        }

        ids.push(line.service_id);
      }

      if (new Set(ids.map(String)).size !== ids.length) {
        throw new Error('Duplicate services are not allowed');
      }

      return true;
    }),

  serviceIdField('lines.*.service_id'),

  body('lines.*.line_price')
    .optional()
    .matches(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/)
    .withMessage('Line price must be a nonnegative amount with up to 2 decimals'),

  body('estimated_ready_date')
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Invalid estimated ready date')
    .bail()
    .custom((value) => {
      if (!HAS_TIMEZONE.test(value) || !Number.isFinite(Date.parse(value))) {
        throw new Error('Date must include a valid timezone');
      }
      return true;
    }),

  noteField('notes_for_customer', 'Customer notes', { allowNull: true }),
  noteField('internal_notes', 'Internal notes', { allowNull: true }),
  validationHandler,
];

export const recordApprovalValidation = [
  positiveIdParam('order_id'),
  rejectUnknownBodyFields(['decision', 'approval_method']),

  body('decision')
    .isIn(['approved', 'declined'])
    .withMessage('Decision must be approved or declined'),

  body('approval_method')
    .isIn(['phone', 'in_person'])
    .withMessage('Approval method must be phone or in_person'),
  validationHandler,
];

export const addExtraJobValidation = [
  positiveIdParam('order_id'),
  rejectUnknownBodyFields(['service_id', 'line_price']),

  serviceIdField('service_id'),

  body('line_price')
    .optional()
    .isString()
    .withMessage('Line price must be a string')
    .bail()
    .matches(MONEY_PATTERN)
    .withMessage('Price must be nonnegative with up to 2 decimal places'),
  validationHandler,
];

export const getEstimateValidation = [
  rejectRequestBody,
  positiveIdParam('order_id'),
  validationHandler,
];
