-- Abe Garage normalized operational schema with immutable historical billing facts.
-- Target: MySQL 8.0.16+ / MySQL 8.4, InnoDB, utf8mb4.
-- Fresh database only. Select an EMPTY database before running this file.
-- Does not DROP, replace, or migrate existing tables; intentionally fails on conflicts.
-- mysql -u <user> -p <empty_database> < schema.sql
-- All application connections MUST set time_zone = '+00:00'.
-- Business timezone: Africa/Addis_Ababa. Single configured currency, initially ETB.
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

CREATE TABLE roles (
    role_id TINYINT UNSIGNED NOT NULL,
    role_name VARCHAR(30) NOT NULL,
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_roles_name (role_name),
    CONSTRAINT ck_roles_id CHECK (role_id IN (1, 2, 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE employees (
    employee_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(254) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id TINYINT UNSIGNED NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (employee_id),
    UNIQUE KEY uq_employees_email (email),
    KEY ix_employees_assignment (role_id, active, employee_id),
    CONSTRAINT fk_employees_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_employees_active CHECK (active IN (0, 1)),
    CONSTRAINT ck_employees_names CHECK (CHAR_LENGTH(TRIM(first_name)) > 0 AND CHAR_LENGTH(TRIM(last_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE password_reset_tokens (
    reset_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id INT UNSIGNED NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (reset_id),
    UNIQUE KEY uq_reset_hash (token_hash),
    KEY ix_reset_employee (employee_id, used_at, expires_at),
    CONSTRAINT fk_reset_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_reset_expiry CHECK (expires_at > created_at),
    CONSTRAINT ck_reset_used CHECK (used_at IS NULL OR used_at >= created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE customers (
    customer_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (customer_id),
    UNIQUE KEY uq_customers_email (email),
    UNIQUE KEY uq_customers_phone (phone),
    CONSTRAINT ck_customers_active CHECK (active IN (0, 1)),
    CONSTRAINT ck_customers_names CHECK (CHAR_LENGTH(TRIM(first_name)) > 0 AND CHAR_LENGTH(TRIM(last_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE vehicles (
    vehicle_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    year SMALLINT UNSIGNED NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    mileage INT UNSIGNED NOT NULL,
    plate VARCHAR(32) NOT NULL,
    vin VARCHAR(32) NULL,
    color VARCHAR(100) NOT NULL,
    PRIMARY KEY (vehicle_id),
    UNIQUE KEY uq_vehicles_plate (plate),
    KEY ix_vehicles_customer (customer_id, vehicle_id),
    CONSTRAINT fk_vehicles_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_vehicle_year CHECK (year BETWEEN 1886 AND 9999),
    CONSTRAINT ck_vehicle_plate CHECK (CHAR_LENGTH(TRIM(plate)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE garage_settings (
    settings_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(254) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    currency CHAR(3) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'ETB',
    PRIMARY KEY (settings_id),
    CONSTRAINT ck_settings_singleton CHECK (settings_id = 1),
    CONSTRAINT ck_settings_vat CHECK (vat_rate BETWEEN 0.00 AND 100.00),
    CONSTRAINT ck_settings_currency CHECK (CHAR_LENGTH(TRIM(currency)) = 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Stable service identity is separate from its immutable revisions.
-- Current display name/price is the highest version_number for each service.
CREATE TABLE services (
    service_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (service_id),
    CONSTRAINT ck_services_active CHECK (active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE service_versions (
    service_version_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    service_id INT UNSIGNED NOT NULL,
    version_number INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    default_price DECIMAL(12,2) NOT NULL,
    labor_hours DECIMAL(8,2) NOT NULL,
    created_by INT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (service_version_id),
    UNIQUE KEY uq_service_revision (service_id, version_number),
    KEY ix_service_version_name (name),
    KEY ix_service_version_creator (created_by),
    CONSTRAINT fk_service_version_service FOREIGN KEY (service_id) REFERENCES services(service_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_service_version_creator FOREIGN KEY (created_by) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_service_version_number CHECK (version_number >= 1),
    CONSTRAINT ck_service_version_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT ck_service_version_price CHECK (default_price >= 0),
    CONSTRAINT ck_service_version_hours CHECK (labor_hours >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE orders (
    order_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id INT UNSIGNED NOT NULL,
    created_by INT UNSIGNED NOT NULL,
    status TINYINT UNSIGNED NOT NULL DEFAULT 1,
    order_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    currency CHAR(3) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    estimated_ready_date DATETIME(6) NOT NULL,
    completed_at DATETIME(6) NULL,
    notes_for_customer TEXT NULL,
    internal_notes TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (order_id),
    UNIQUE KEY uq_orders_hash (order_hash),
    KEY ix_orders_vehicle (vehicle_id, created_at),
    KEY ix_orders_creator (created_by),
    KEY ix_orders_status (status, created_at),
    KEY ix_orders_completed (completed_at),
    CONSTRAINT fk_orders_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_orders_creator FOREIGN KEY (created_by) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_orders_status CHECK (status IN (1, 2, 3, 4, 5)),
    CONSTRAINT ck_orders_vat CHECK (vat_rate BETWEEN 0.00 AND 100.00),
    CONSTRAINT ck_orders_currency CHECK (CHAR_LENGTH(TRIM(currency)) = 3),
    CONSTRAINT ck_orders_completion CHECK (
        (status = 4 AND completed_at IS NOT NULL) OR
        (status <> 4 AND completed_at IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE order_lines (
    line_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    service_version_id INT UNSIGNED NOT NULL,
    agreed_price DECIMAL(12,2) NOT NULL,
    technician_id INT UNSIGNED NULL,
    line_status TINYINT UNSIGNED NOT NULL DEFAULT 0,
    started_at DATETIME(6) NULL,
    done_at DATETIME(6) NULL,
    technician_note TEXT NULL,
    PRIMARY KEY (line_id),
    UNIQUE KEY uq_order_service_version (order_id, service_version_id),
    KEY ix_order_lines_version (service_version_id),
    KEY ix_order_lines_technician (technician_id, line_status),
    CONSTRAINT fk_lines_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_lines_service_version FOREIGN KEY (service_version_id) REFERENCES service_versions(service_version_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_lines_technician FOREIGN KEY (technician_id) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_line_price CHECK (agreed_price >= 0),
    CONSTRAINT ck_line_status CHECK (line_status IN (0, 1, 2)),
    CONSTRAINT ck_line_times CHECK (
        (line_status = 0 AND started_at IS NULL AND done_at IS NULL) OR
        (line_status = 1 AND started_at IS NOT NULL AND done_at IS NULL) OR
        (line_status = 2 AND started_at IS NOT NULL AND done_at IS NOT NULL AND done_at >= started_at)
    ),
    CONSTRAINT ck_line_assignment CHECK (line_status = 0 OR technician_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Append-only approval decisions, including every reapproval and initial decline.
-- Current work authorization is expressed by orders.status, not a copied approver column.
CREATE TABLE order_approvals (
    approval_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    recorded_by INT UNSIGNED NOT NULL,
    decision VARCHAR(10) NOT NULL,
    approval_method VARCHAR(10) NOT NULL,
    decided_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (approval_id),
    KEY ix_approvals_order (order_id, approval_id),
    KEY ix_approvals_employee (recorded_by),
    CONSTRAINT fk_approvals_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_approvals_recorder FOREIGN KEY (recorded_by) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_approval_decision CHECK (decision IN ('approved', 'declined')),
    CONSTRAINT ck_approval_method CHECK (approval_method IN ('phone', 'in_person'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- One immutable issued invoice per completed order.
-- Atomic historical document fields are facts at issue time, not current master data.
-- No duplicated customer_id/vehicle_id/service prices/tax/totals or JSON invoice payload.
CREATE TABLE invoices (
    invoice_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    invoice_number VARCHAR(32) NOT NULL,
    issued_by INT UNSIGNED NOT NULL,
    issued_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    garage_name VARCHAR(150) NOT NULL,
    garage_address VARCHAR(500) NOT NULL,
    garage_phone VARCHAR(32) NOT NULL,
    garage_email VARCHAR(254) NOT NULL,
    customer_first_name VARCHAR(100) NOT NULL,
    customer_last_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(254) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    vehicle_year SMALLINT UNSIGNED NOT NULL,
    vehicle_make VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    vehicle_mileage INT UNSIGNED NOT NULL,
    vehicle_plate VARCHAR(32) NOT NULL,
    vehicle_vin VARCHAR(32) NULL,
    vehicle_color VARCHAR(100) NOT NULL,
    PRIMARY KEY (invoice_id),
    UNIQUE KEY uq_invoices_order (order_id),
    UNIQUE KEY uq_invoices_number (invoice_number),
    KEY ix_invoices_issuer (issued_by),
    CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_invoices_issuer FOREIGN KEY (issued_by) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_invoice_number CHECK (CHAR_LENGTH(TRIM(invoice_number)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Full cash settlement only. Presence of this row means paid.
-- No paid flag, duplicated paid fields, or redundant full-payment amount.
CREATE TABLE cash_payments (
    invoice_id INT UNSIGNED NOT NULL,
    received_by INT UNSIGNED NOT NULL,
    paid_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (invoice_id),
    KEY ix_payments_employee (received_by),
    KEY ix_payments_time (paid_at, invoice_id),
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_payments_receiver FOREIGN KEY (received_by) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE order_history (
    history_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    employee_id INT UNSIGNED NULL,
    action VARCHAR(64) NOT NULL,
    details TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (history_id),
    KEY ix_history_order (order_id, created_at, history_id),
    KEY ix_history_employee (employee_id),
    CONSTRAINT fk_history_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_history_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Read models calculate aggregates rather than storing redundant totals.
CREATE VIEW v_current_services AS
SELECT s.service_id, s.active, s.created_at,
       sv.service_version_id, sv.version_number, sv.name, sv.description,
       sv.default_price AS price, sv.labor_hours
FROM services AS s
JOIN service_versions AS sv ON sv.service_id = s.service_id
WHERE sv.version_number = (
    SELECT MAX(sv2.version_number) FROM service_versions AS sv2
    WHERE sv2.service_id = s.service_id
);

CREATE VIEW v_order_financials AS
SELECT x.order_id, x.currency, x.vat_rate, x.subtotal,
       CAST(ROUND(x.subtotal * x.vat_rate / 100, 2) AS DECIMAL(16,2)) AS vat_amount,
       CAST(x.subtotal + ROUND(x.subtotal * x.vat_rate / 100, 2) AS DECIMAL(16,2)) AS total
FROM (
    SELECT o.order_id, o.currency, o.vat_rate,
           CAST(COALESCE(SUM(ol.agreed_price), 0.00) AS DECIMAL(16,2)) AS subtotal
    FROM orders AS o
    LEFT JOIN order_lines AS ol ON ol.order_id = o.order_id
    GROUP BY o.order_id, o.currency, o.vat_rate
) AS x;

CREATE VIEW v_orders AS
SELECT o.*, v.customer_id, f.subtotal, f.vat_amount, f.total,
       (cp.invoice_id IS NOT NULL) AS paid, cp.paid_at,
       cp.received_by AS paid_received_by,
       a.decision AS last_decision, a.recorded_by AS last_decision_by,
       a.decided_at AS last_decision_at, a.approval_method AS last_decision_method
FROM orders AS o
JOIN vehicles AS v ON v.vehicle_id = o.vehicle_id
JOIN v_order_financials AS f ON f.order_id = o.order_id
LEFT JOIN invoices AS i ON i.order_id = o.order_id
LEFT JOIN cash_payments AS cp ON cp.invoice_id = i.invoice_id
LEFT JOIN order_approvals AS a ON a.approval_id = (
    SELECT MAX(a2.approval_id) FROM order_approvals AS a2 WHERE a2.order_id = o.order_id
);

CREATE VIEW v_invoice_financials AS
SELECT i.*, f.currency, f.vat_rate, f.subtotal, f.vat_amount, f.total,
       (cp.invoice_id IS NOT NULL) AS paid, cp.paid_at, cp.received_by AS paid_received_by
FROM invoices AS i
JOIN v_order_financials AS f ON f.order_id = i.order_id
LEFT JOIN cash_payments AS cp ON cp.invoice_id = i.invoice_id;

CREATE VIEW v_invoice_lines AS
SELECT i.invoice_id, ol.line_id, sv.name AS service_name,
       sv.description AS service_description, sv.labor_hours,
       ol.agreed_price AS line_price
FROM invoices AS i
JOIN order_lines AS ol ON ol.order_id = i.order_id
JOIN service_versions AS sv ON sv.service_version_id = ol.service_version_id;

-- Integrity guards supplement (do not replace) transaction-aware Express services.
-- Use the MySQL CLI/Workbench script runner for DELIMITER syntax.
DELIMITER $$

CREATE TRIGGER trg_vehicles_owner_immutable BEFORE UPDATE ON vehicles
FOR EACH ROW
BEGIN
    IF NEW.vehicle_id <> OLD.vehicle_id OR NEW.customer_id <> OLD.customer_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle identity and ownership are immutable in this release';
    END IF;
    IF NEW.mileage < OLD.mileage THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mileage cannot decrease';
    END IF;
END$$

CREATE TRIGGER trg_orders_identity_guard BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.order_id <> OLD.order_id OR NEW.vehicle_id <> OLD.vehicle_id OR
       NEW.created_by <> OLD.created_by OR NEW.order_hash <> OLD.order_hash OR
       NEW.created_at <> OLD.created_at OR NEW.vat_rate <> OLD.vat_rate OR NEW.currency <> OLD.currency THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order identity and agreed tax/currency are immutable';
    END IF;
    IF EXISTS (SELECT 1 FROM invoices WHERE order_id = OLD.order_id) AND
       (NEW.status <> OLD.status OR NOT (NEW.completed_at <=> OLD.completed_at)) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Issued invoice order cannot change completion state';
    END IF;
END$$

CREATE TRIGGER trg_order_lines_insert_guard BEFORE INSERT ON order_lines
FOR EACH ROW
BEGIN
    DECLARE parent_status TINYINT UNSIGNED;
    SELECT status INTO parent_status FROM orders WHERE order_id = NEW.order_id FOR UPDATE;
    IF parent_status <> 1 OR EXISTS (SELECT 1 FROM invoices WHERE order_id = NEW.order_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'New work requires awaiting approval and no invoice';
    END IF;
    IF NEW.line_status <> 0 OR NEW.started_at IS NOT NULL OR NEW.done_at IS NOT NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'New job must be unstarted';
    END IF;
END$$

CREATE TRIGGER trg_order_lines_update_guard BEFORE UPDATE ON order_lines
FOR EACH ROW
BEGIN
    DECLARE parent_status TINYINT UNSIGNED;
    SELECT status INTO parent_status FROM orders WHERE order_id = OLD.order_id FOR UPDATE;
    IF NEW.line_id <> OLD.line_id OR NEW.order_id <> OLD.order_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Job identity and parent are immutable';
    END IF;
    IF EXISTS (SELECT 1 FROM invoices WHERE order_id = OLD.order_id) THEN
        IF NEW.service_version_id <> OLD.service_version_id OR NEW.agreed_price <> OLD.agreed_price OR
           NOT (NEW.technician_id <=> OLD.technician_id) OR NEW.line_status <> OLD.line_status OR
           NOT (NEW.started_at <=> OLD.started_at) OR NOT (NEW.done_at <=> OLD.done_at) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Issued invoice job facts are immutable';
        END IF;
    END IF;
    IF NEW.service_version_id <> OLD.service_version_id OR NEW.agreed_price <> OLD.agreed_price THEN
        IF parent_status <> 1 OR OLD.line_status <> 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only unstarted awaiting-approval jobs can be repriced';
        END IF;
    END IF;
    IF NEW.line_status <> OLD.line_status THEN
        IF parent_status NOT IN (2, 3) OR NEW.line_status <> OLD.line_status + 1 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Job progress requires approval and sequential transition';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_order_lines_delete_guard BEFORE DELETE ON order_lines
FOR EACH ROW
BEGIN
    DECLARE parent_status TINYINT UNSIGNED;
    SELECT status INTO parent_status FROM orders WHERE order_id = OLD.order_id FOR UPDATE;
    IF parent_status <> 1 OR OLD.line_status <> 0 OR EXISTS (SELECT 1 FROM invoices WHERE order_id = OLD.order_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only unstarted awaiting-approval lines can be removed';
    END IF;
END$$

CREATE TRIGGER trg_invoice_issue_guard BEFORE INSERT ON invoices
FOR EACH ROW
BEGIN
    DECLARE parent_status TINYINT UNSIGNED;
    SELECT status INTO parent_status FROM orders WHERE order_id = NEW.order_id FOR UPDATE;
    IF parent_status <> 4 OR NOT EXISTS (SELECT 1 FROM order_lines WHERE order_id = NEW.order_id) OR
       EXISTS (SELECT 1 FROM order_lines WHERE order_id = NEW.order_id AND line_status <> 2) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invoice requires a completed order with all jobs done';
    END IF;
END$$

CREATE TRIGGER trg_cash_payment_guard BEFORE INSERT ON cash_payments
FOR EACH ROW
BEGIN
    DECLARE invoice_time DATETIME(6);
    SELECT issued_at INTO invoice_time FROM invoices WHERE invoice_id = NEW.invoice_id;
    IF NEW.paid_at < invoice_time THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment cannot predate invoice';
    END IF;
END$$

CREATE TRIGGER trg_service_versions_update_immutable BEFORE UPDATE ON service_versions
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'service_versions records are immutable; append new records instead';
END$$

CREATE TRIGGER trg_service_versions_delete_immutable BEFORE DELETE ON service_versions
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'service_versions records are immutable; append new records instead';
END$$

CREATE TRIGGER trg_order_approvals_update_immutable BEFORE UPDATE ON order_approvals
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'order_approvals records are immutable; append new records instead';
END$$

CREATE TRIGGER trg_order_approvals_delete_immutable BEFORE DELETE ON order_approvals
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'order_approvals records are immutable; append new records instead';
END$$

CREATE TRIGGER trg_invoices_update_immutable BEFORE UPDATE ON invoices
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'invoices records are immutable; append new records instead';
END$$

CREATE TRIGGER trg_invoices_delete_immutable BEFORE DELETE ON invoices
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'invoices records are immutable; append new records instead';
END$$

CREATE TRIGGER trg_cash_payments_update_immutable BEFORE UPDATE ON cash_payments
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'cash_payments records are immutable; append new records instead';
END$$

CREATE TRIGGER trg_cash_payments_delete_immutable BEFORE DELETE ON cash_payments
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'cash_payments records are immutable; append new records instead';
END$$

CREATE TRIGGER trg_order_history_update_immutable BEFORE UPDATE ON order_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'order_history records are immutable; append new records instead';
END$$

CREATE TRIGGER trg_order_history_delete_immutable BEFORE DELETE ON order_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'order_history records are immutable; append new records instead';
END$$

DELIMITER ;

INSERT INTO roles (role_id, role_name) VALUES
    (1, 'Technician'), (2, 'Manager'), (3, 'Admin');

-- No default password or fake production garage contact information is seeded.
-- Installer/service must seed one bcrypt-hashed Admin and singleton garage settings
-- from environment configuration, in a transaction after schema creation.
-- API/application responsibilities and compatibility mapping: see README.md.
