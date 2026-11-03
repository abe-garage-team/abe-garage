
CREATE TABLE sessions (
    session_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id INT UNSIGNED NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    last_seen_at DATETIME(6) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    PRIMARY KEY (session_id),
    UNIQUE KEY uq_sessions_token_hash (token_hash),
    KEY ix_sessions_employee (employee_id, created_at),
    KEY ix_sessions_expires (expires_at),
    CONSTRAINT fk_sessions_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_sessions_expiry CHECK (expires_at > created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auth_rate_limits (
    key_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    hit_count INT UNSIGNED NOT NULL DEFAULT 1,
    window_ends_at DATETIME(6) NOT NULL,
    PRIMARY KEY (key_hash),
    KEY ix_rate_limits_window (window_ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE app_setup (
    setup_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
    installed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    installed_by VARCHAR(100) NOT NULL DEFAULT 'install-endpoint',
    PRIMARY KEY (setup_id),
    CONSTRAINT ck_app_setup_singleton CHECK (setup_id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auth_events (
    event_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    event_type VARCHAR(40) NOT NULL,
    employee_id INT UNSIGNED NULL,
    actor_employee_id INT UNSIGNED NULL,
    email_attempted VARCHAR(254) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    request_id CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (event_id),
    KEY ix_auth_events_employee (employee_id, created_at),
    KEY ix_auth_events_type (event_type, created_at),
    CONSTRAINT fk_auth_events_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_auth_events_actor FOREIGN KEY (actor_employee_id) REFERENCES employees(employee_id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE employees DROP COLUMN token_version;
