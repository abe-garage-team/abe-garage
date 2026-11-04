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

// BE-030 — List and filter orders
export const listOrdersValidation = [
  // Reject query parameters not documented by BE-030.
  query().custom((value) => {
    const allowedFields = [
      "search",
      "status",
      "paid",
      "customer_id",
      "vehicle_id",
      "unpaid_only",
      "page",
      "limit",
    ];

    const unknownFields = Object.keys(value ?? {}).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      throw new Error(
        `Unknown query parameters: ${unknownFields.join(", ")}`
      );
    }

    return true;
  }),

  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Search cannot be empty"),

  query("status")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Status must be between 1 and 5")
    .bail()
    .toInt(),

  query("paid")
    .optional()
    .isIn(["true", "false"])
    .withMessage("Paid must be true or false")
    .bail()
    .toBoolean(),

  query("customer_id")
    .optional()
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage("Customer ID must be a positive integer")
    .bail()
    .toInt(),

  query("vehicle_id")
    .optional()
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage("Vehicle ID must be a positive integer")
    .bail()
    .toInt(),

  query("unpaid_only")
    .optional()
    .isIn(["true", "false"])
    .withMessage("Unpaid only must be true or false")
    .bail()
    .toBoolean(),

  query("page")
    .optional()
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage("Page must be a positive integer")
    .bail()
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .bail()
    .toInt(),

  // Business rule: unpaid_only=true requires status 4 and paid=false if those filters are supplied.
  query().custom((_value, { req }) => {
    const unpaidOnly = req.query.unpaid_only === true ||
      req.query.unpaid_only === "true";

    if (!unpaidOnly) return true;

    if (
      req.query.paid === true ||
      req.query.paid === "true"
    ) {
      throw new Error(
        "unpaid_only=true cannot be combined with paid=true"
      );
    }

    if (
      req.query.status !== undefined &&
      Number(req.query.status) !== 4
    ) {
      throw new Error(
        "unpaid_only=true requires status=4"
      );
    }

    return true;
  }),
];


// BE-031 — Get Order by ID Validation
export const getOrderParamsValidation = [
  param("order_id")
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage("Order ID must be a positive safe integer")
    .toInt(),
];

// BE-032 — Update order
//It does not accept customer_id, vehicle_id, paid, status, vat_rate, or calculated totals because BE-032 explicitly prohibits modifying those fields.
export const updateOrderValidation = [
  param("order_id")
    .isInt({ min: 1, max: 4294967295 })
    .withMessage("Order ID must be a positive integer")
    .bail()
    .toInt(),

  // Reject unknown fields.
  body().custom((value) => {
    const allowed = [
      "lines",
      "estimated_ready_date",
      "notes_for_customer",
      "internal_notes",
    ];

    if (!value || typeof value !== "object" ||
        Array.isArray(value)) {
      throw new Error("Request body must be an object");
    }

    if (Object.keys(value).length === 0) {
      throw new Error("Provide at least one field to update");
    }

    if (Object.keys(value).some(
      (key) => !allowed.includes(key)
    )) {
      throw new Error("Unknown fields are not allowed");
    }

    return true;
  }),

  body("lines")
    .optional()
    .isArray({ min: 1, max: 100 })
    .withMessage("Lines must contain 1 to 100 services")
    .bail()
    .custom((lines) => {
      const ids = [];

      for (const line of lines) {
        if (!line || typeof line !== "object" ||
            Array.isArray(line)) {
          throw new Error("Each line must be an object");
        }

        const allowed = ["service_id", "line_price"];

        if (Object.keys(line).some(
          (key) => !allowed.includes(key)
        )) {
          throw new Error("Unknown line fields");
        }

        ids.push(line.service_id);
      }

      if (new Set(ids.map(String)).size !== ids.length) {
        throw new Error("Duplicate services are not allowed");
      }

      return true;
    }),

  body("lines.*.service_id")
    .isInt({ min: 1, max: 4294967295 })
    .withMessage("Invalid service ID")
    .bail()
    .toInt(),

  body("lines.*.line_price")
    .optional()
    .matches(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/)
    .withMessage(
      "Line price must be a nonnegative amount with up to 2 decimals"
    ),

  body("estimated_ready_date")
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("Invalid estimated ready date")
    .bail()
    .custom((value) => {
      if (
        !/(Z|[+-]\d{2}:\d{2})$/i.test(value) ||
        !Number.isFinite(Date.parse(value))
      ) {
        throw new Error("Date must include a valid timezone");
      }
      return true;
    }),

  body("notes_for_customer")
    .optional({ values: "null" })
    .isString()
    .withMessage("Customer notes must be a string")
    .bail()
    .trim(),

  body("internal_notes")
    .optional({ values: "null" })
    .isString()
    .withMessage("Internal notes must be a string")
    .bail()
    .trim(),
];

// BE-033 — Approve or decline an order
//rejects unknown fields, including client-supplied approved_by, approved_at, and status. Those values must come from the authenticated employee and server-side logic.
export const recordApprovalValidation = [
  param("order_id")
    .isInt({ min: 1, max: 4294967295 })
    .withMessage("Order ID must be a positive integer")
    .bail()
    .toInt(),

  body().custom((value) => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      throw new Error("Request body must be an object");
    }

    const allowed = ["decision", "approval_method"];

    if (Object.keys(value).some(
      (key) => !allowed.includes(key)
    )) {
      throw new Error("Unknown fields are not allowed");
    }

    return true;
  }),

  body("decision")
    .isIn(["approved", "declined"])
    .withMessage("Decision must be approved or declined"),

  body("approval_method")
    .isIn(["phone", "in_person"])
    .withMessage("Approval method must be phone or in_person"),
];