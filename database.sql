-- TEENA THANMAY FITNESS database setup; safe to run repeatedly.
CREATE DATABASE IF NOT EXISTS gym_membership_management_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_membership_management_system;

CREATE TABLE IF NOT EXISTS members (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL,
 email VARCHAR(190) NOT NULL UNIQUE, phone VARCHAR(30) NOT NULL,
 gender ENUM('Female','Male','Non-binary','Prefer not to say','Other') NOT NULL,
 joining_date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS membership_plans (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE,
 duration_days INT UNSIGNED NOT NULL, price DECIMAL(10,2) NOT NULL,
 access_level VARCHAR(120) NOT NULL, description TEXT NOT NULL,
 status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 member_id INT UNSIGNED NOT NULL, plan_id INT UNSIGNED NOT NULL,
 start_date DATE NOT NULL, end_date DATE NOT NULL,
 payment_status ENUM('Paid','Pending','Failed') NOT NULL DEFAULT 'Pending',
 amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_sub_member FOREIGN KEY(member_id) REFERENCES members(id) ON UPDATE CASCADE ON DELETE CASCADE,
 CONSTRAINT fk_sub_plan FOREIGN KEY(plan_id) REFERENCES membership_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO membership_plans(name,duration_days,price,access_level,description,status) VALUES
('Basic',30,999.00,'Gym floor access','Strength and cardio floor access with a starter-friendly routine.','Active'),
('Premium',90,2499.00,'Gym + group classes','Full gym access plus instructor-led group fitness classes.','Active'),
('Elite',365,7999.00,'All access + personal training','All-access training experience with priority facilities and personal-training sessions.','Active')
ON DUPLICATE KEY UPDATE duration_days=VALUES(duration_days), price=VALUES(price),
 access_level=VALUES(access_level), description=VALUES(description), status=VALUES(status);
