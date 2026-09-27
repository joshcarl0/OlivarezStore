-- ============================================================
-- OLIVAREZ COLLEGE UNIFORM STORE SUPPLY DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS olivarez_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE olivarez_store;

-- ─── SCHOOL RECORDS (pre-loaded by admin) ─────────────────
CREATE TABLE IF NOT EXISTS school_records (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  VARCHAR(20) NOT NULL UNIQUE,
  last_name   VARCHAR(100) NOT NULL,
  first_name  VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  year_level  VARCHAR(50),
  course      VARCHAR(100),
  is_active   TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── STUDENTS (registered users) ──────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      VARCHAR(20) NOT NULL UNIQUE,
  last_name       VARCHAR(100) NOT NULL,
  first_name      VARCHAR(100),
  email           VARCHAR(150) UNIQUE,
  mobile          VARCHAR(20),
  password_hash   VARCHAR(255) NOT NULL,
  gender          ENUM('Girls','Boys') DEFAULT NULL,
  year_level      VARCHAR(50),
  size_blouse     VARCHAR(10),
  size_skirt      VARCHAR(10),
  size_pe_shirt   VARCHAR(10),
  otp_code        VARCHAR(6),
  otp_expires_at  DATETIME,
  is_verified     TINYINT(1) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── PRODUCTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  category    ENUM('Blouse','Skirt','PE Shirt','PE Shorts','Necktie','ID Lace','Others') NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  stock       INT DEFAULT 0,
  image_url   VARCHAR(255),
  sizes       VARCHAR(255),          -- JSON string e.g. ["XS","M","L","XL"]
  is_active   TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── ORDERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      VARCHAR(20) NOT NULL,
  status          ENUM('Pending','Processing','Ready','Completed','Cancelled') DEFAULT 'Pending',
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- ─── ORDER ITEMS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  size        VARCHAR(10),
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ─── SAMPLE SCHOOL RECORDS (for testing) ──────────────────
INSERT IGNORE INTO school_records (student_id, last_name, first_name, year_level, course) VALUES
('2024-00001', 'Dela Cruz',  'Juan',   '1st Year', 'BSIT'),
('2024-00002', 'Santos',     'Maria',  '2nd Year', 'BSN'),
('2024-00003', 'Reyes',      'Pedro',  '3rd Year', 'BSBA'),
('2024-00004', 'Garcia',     'Ana',    '1st Year', 'BSE'),
('2024-00005', 'Mendoza',    'Jose',   '4th Year', 'BSCS'),
('2024-00006', 'Torres',     'Luz',    '2nd Year', 'BSHRM'),
('2024-00007', 'Bautista',   'Carlo',  '1st Year', 'BSIT'),
('2024-00008', 'Aquino',     'Rosa',   '3rd Year', 'BSN');

-- ─── SAMPLE PRODUCTS ──────────────────────────────────────
INSERT IGNORE INTO products (name, description, category, price, stock, sizes) VALUES
('School Blouse',       'Official Olivarez College blouse for female students',   'Blouse',    350.00, 50, '["XS","M","L","XL","XXL","XXXL"]'),
('School Skirt',        'Official pleated school skirt',                          'Skirt',     400.00, 40, '["24","26","28","30","32"]'),
('PE Shirt',            'Official PE uniform shirt',                              'PE Shirt',  280.00, 60, '["XS","M","L","XL","XXL","XXXL"]'),
('PE Shorts',           'Official PE shorts',                                     'PE Shorts', 250.00, 55, '["XS","M","L","XL","XXL","XXXL"]'),
('Necktie',             'Official school necktie',                                'Necktie',   150.00, 80, NULL),
('ID Lace',             'Official school ID lace with OC logo',                   'ID Lace',    50.00,100, NULL);

-- ─── INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_order_student ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_product_category ON products(category);
