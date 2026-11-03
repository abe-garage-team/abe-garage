import { body, param, query } from "express-validator";

// BE-029 — Create Order Validation
export const createOrderValidation = [
  // Reject unknown fields (similar to Zod .strict())
  body().custom((value) => {
    const allowedFields = [
      "customer_id",
      "vehicle_id",
      "lines",
      "estimated_ready_date",
      "notes_for_customer",
      "internal_notes",
    ];

    const unknownFields = Object.keys(value ?? {}).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      throw new Error(
        `Unknown fields: ${unknownFields.join(", ")}`
      );
    }

    return true;
  }),

  body("customer_id")
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage("Customer ID must be a positive integer"),

  body("vehicle_id")
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage("Vehicle ID must be a positive integer"),

  body("lines")
    .isArray({ min: 1, max: 100 })
    .withMessage("At least 1 and maximum 100 services are allowed")
    .bail()   
    .custom((lines) => {
    for (const line of lines) {
      if (
        !line ||
        typeof line !== "object" ||
        Array.isArray(line) ||
        !Object.hasOwn(line, "service_id") ||
        Object.keys(line).some((key) => key !== "service_id")
      ) {
        throw new Error("Each line must contain only service_id");
      }
    }

    const serviceIds = lines.map((line) => String(line.service_id));

    if (new Set(serviceIds).size !== lines.length) {
      throw new Error("Duplicate services are not allowed");
    }

    return true;
    }),

  body("lines.*.service_id")
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage("Service ID must be a positive integer"),

  body("estimated_ready_date")
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("Estimated ready date must be ISO 8601")
    .bail()
    .custom((value) => {
      // Require an explicit timezone: Z or ±HH:MM
      if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value)) {
        throw new Error("Estimated ready date must include a timezone");
      }

      if (new Date(value).getTime() <= Date.now()) {
        throw new Error("Estimated ready date must be in the future");
      }

      return true;
    }),

  body("notes_for_customer")
    .optional()
    .isString()
    .withMessage("Notes for customer must be a string")
    .bail()
    .trim(),

  body("internal_notes")
    .optional()
    .isString()
    .withMessage("Internal notes must be a string")
    .bail()
    .trim(),
];