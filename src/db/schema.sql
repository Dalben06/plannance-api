CREATE TABLE IF NOT EXISTS calendar_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NULL,
    amount DECIMAL(12, 2) NOT NULL,
    `type` ENUM('debit', 'credit') NOT NULL,
    color VARCHAR(32) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_calendar_events_user_id (user_id),
    INDEX idx_calendar_events_start_at (start_at)
);
