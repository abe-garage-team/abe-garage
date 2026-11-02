import { body, param } from 'express-validator';

const currentYear = new Date().getFullYear();
const maxYear = currentYear + 1;

// Validation rules for adding a vehicle to a customer (BE-020)
export const createVehicleValidation = [
    body('customer_id')
        .notEmpty()
        .withMessage('Customer ID is required')
        .isInt({ min: 1 })
        .withMessage('Customer ID must be a positive integer'),

    body('year')
        .notEmpty()
        .withMessage('Year is required')
        .isInt({ min: 1886, max: maxYear })
        .withMessage(`Year must be an integer between 1886 and ${maxYear}`),

    body('make')
        .trim()
        .notEmpty()
        .withMessage('Make is required')
        .isLength({ max: 100 })
        .withMessage('Make cannot exceed 100 characters'),

    body('model')
        .trim()
        .notEmpty()
        .withMessage('Model is required')
        .isLength({ max: 100 })
        .withMessage('Model cannot exceed 100 characters'),

    body('type')
        .trim()
        .notEmpty()
        .withMessage('Vehicle type is required')
        .isLength({ max: 100 })
        .withMessage('Vehicle type cannot exceed 100 characters'),

    body('mileage')
        .notEmpty()
        .withMessage('Mileage is required')
        .isInt({ min: 0 })
        .withMessage('Mileage must be a non-negative integer'),

    body('plate')
        .trim()
        .notEmpty()
        .withMessage('Plate number is required')
        .isLength({ min: 1, max: 32 })
        .withMessage('Plate number must not exceed 32 characters'),

    body('vin')
        .optional({ values: 'null' })
        .trim()
        .isLength({ max: 32 })
        .withMessage('VIN cannot exceed 32 characters'),

    body('color')
        .trim()
        .notEmpty()
        .withMessage('Color is required')
        .isLength({ max: 100 })
        .withMessage('Color cannot exceed 100 characters'),
];

// Validation rules for retrieving a vehicle (BE-022)
export const getVehicleValidation = [
    param('vehicle_id').isInt({ min: 1 }).withMessage('Vehicle ID must be a positive integer'),
];