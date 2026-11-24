
-- Drop existing tables if re-running
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS staff_users CASCADE;
DROP TABLE IF EXISTS school_records CASCADE;

-- 1. school_records
CREATE TABLE school_records (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  last_name VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) DEFAULT NULL,
  year_level VARCHAR(50) DEFAULT NULL,
  course VARCHAR(100) DEFAULT NULL,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. staff_users
CREATE TABLE staff_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Store Staff',
  station VARCHAR(30) DEFAULT 'Counter 01',
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. students
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  last_name VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) DEFAULT NULL,
  email VARCHAR(150) UNIQUE DEFAULT NULL,
  mobile VARCHAR(20) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gender VARCHAR(20) DEFAULT NULL,
  year_level VARCHAR(50) DEFAULT NULL,
  department VARCHAR(60) DEFAULT NULL,
  course_strand VARCHAR(60) DEFAULT NULL,
  size_blouse VARCHAR(10) DEFAULT NULL,
  size_skirt VARCHAR(10) DEFAULT NULL,
  size_pants VARCHAR(10) DEFAULT NULL,
  size_pe_shirt VARCHAR(10) DEFAULT NULL,
  otp_code VARCHAR(6) DEFAULT NULL,
  otp_expires_at TIMESTAMPTZ DEFAULT NULL,
  is_verified SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT DEFAULT NULL,
  category VARCHAR(100) NOT NULL,
  department VARCHAR(60) DEFAULT 'All',
  gender VARCHAR(20) DEFAULT 'Unisex',
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  image_url TEXT DEFAULT NULL,
  sizes TEXT DEFAULT NULL,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(30) DEFAULT NULL,
  student_id VARCHAR(20) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'Pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pickup_day VARCHAR(60) DEFAULT NULL,
  time_slot VARCHAR(60) DEFAULT NULL,
  payment_method VARCHAR(60) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. order_items
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  size VARCHAR(10) DEFAULT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL
);

-- Enable Public Read / Write & Grant Data API privileges for anon + authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER TABLE school_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;


-- INSERT DATA
INSERT INTO school_records VALUES (2,'2024-00002','Santos','Maria',NULL,'2nd Year','BSN',1,'2026-09-26 16:51:58'),(3,'2024-00003','Reyes','Pedro',NULL,'3rd Year','BSBA',1,'2026-09-26 16:51:58'),(4,'2024-00004','Garcia','Ana',NULL,'1st Year','BSE',1,'2026-09-26 16:51:58'),(5,'2024-00005','Mendoza','Jose',NULL,'4th Year','BSCS',1,'2026-09-26 16:51:58'),(6,'2024-00006','Torres','Luz',NULL,'2nd Year','BSHRM',1,'2026-09-26 16:51:58'),(7,'2024-00007','Bautista','Carlo',NULL,'1st Year','BSIT',1,'2026-09-26 16:51:58'),(8,'2024-00008','Aquino','Rosa',NULL,'3rd Year','BSN',1,'2026-09-26 16:51:58'),(9,'232C-0018','Fernan','Josh Carl',NULL,'College - 4th Year','',1,'2026-09-27 02:53:56');

INSERT INTO staff_users VALUES (1,'staff01','Store Releasing Staff','staff@olivarezcollege.edu.ph','$2y$10$c9IvB6B9DWrO7dH5F/5ezOSQIzGlqV3zs3aw.OJ1U.RLTTEG68UL6','Store Staff','Counter 01',1,'2026-09-27 04:12:24'),(2,'admin','Uniform Store Administrator','admin@olivarezcollege.edu.ph','$2y$10$p5YHACtSvOu4HoaktnvmY.6audS199VaR3uEm9f605sjZQHHU0ykC','Super Admin','Main Office',1,'2026-09-27 04:12:24');

INSERT INTO students VALUES (1,'232C-0018','Fernan','Josh Carl','joshcarl.fernan@olivarezcollege.edu.ph','09310249079','$2y$10$fgNi/hPMmEetAXTkaKdBmOM/BKgSidqoyvtkqg9NV4FCYC70g8lY6','Boys','College - 4th Year','College','','M',NULL,NULL,NULL,NULL,NULL,1,'2026-09-27 02:53:56','2026-09-27 04:12:23'),(3,'231S-0042','Santos','Maria','maria.santos@olivarezcollege.edu.ph','09171234567','$2y$10$fgNi/hPMmEetAXTkaKdBmOM/BKgSidqoyvtkqg9NV4FCYC70g8lY6','Girls','Grade 11','Senior High','STEM',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-09-27 04:12:24','2026-09-27 04:12:24');

INSERT INTO products VALUES (1,'Girls'' blouse, Junior High','Official Olivarez College junior high blouse with green piping and school crest','Tops','Junior High','Girls',385.00,50,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(2,'Girls'' skirt, Junior High','Official pleated green plaid school skirt with zipper and inner lining','Bottoms','Junior High','Girls',385.00,40,NULL,'[\"24\",\"26\",\"28\",\"30\",\"32\",\"34\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(3,'Men''s blouse / polo, Junior High','Official junior high polo shirt with school embroidery and collar piping','Tops','Junior High','Boys',295.00,45,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(4,'School Pants, Junior High','Official junior high dark green school trousers','Bottoms','Junior High','Boys',350.00,45,NULL,'[\"26\",\"28\",\"30\",\"32\",\"34\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(5,'SHS Blouse','Official Olivarez Senior High school blouse with embroidered logo','Tops','Senior High','Girls',395.00,50,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(6,'SHS Skirt','Official Senior High pleated school skirt','Bottoms','Senior High','Girls',395.00,45,NULL,'[\"24\",\"26\",\"28\",\"30\",\"32\",\"34\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(7,'SHS Polo-Barong','Official Senior High embroidered polo-barong uniform','Tops','Senior High','Boys',320.00,50,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(8,'SHS Slacks','Official Senior High school slacks / trousers','Bottoms','Senior High','Boys',380.00,40,NULL,'[\"26\",\"28\",\"30\",\"32\",\"34\",\"36\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(9,'SHS TVL Culinary Jacket','Double-breasted white chef jacket with Olivarez TVL emblem','Tops','Senior High','Unisex',500.00,30,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(10,'Culinary Houndstooth Pants','Comfort-fit culinary kitchen pants with drawstring','Bottoms','Senior High','Unisex',420.00,30,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(11,'College Polo-Barong','Official Olivarez College polo-barong with school seal embroidery','Tops','College','Boys',350.00,58,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 04:05:20'),(12,'College Blouse','Official Olivarez College corporate style female uniform blouse','Tops','College','Girls',385.00,60,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(13,'College Slacks','Official Olivarez College formal black/dark trousers','Bottoms','College','Boys',400.00,50,NULL,'[\"28\",\"30\",\"32\",\"34\",\"36\",\"38\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(14,'College Skirt','Official Olivarez College corporate pencil/A-line skirt','Bottoms','College','Girls',395.00,50,NULL,'[\"24\",\"26\",\"28\",\"30\",\"32\",\"34\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(15,'BSN Nursing White Duty Top','Official white clinical uniform top with embroidered OC college seal','Tops','College','Girls',480.00,35,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(16,'BSN Nursing Duty Pants','Official white clinical trousers with stain-resistant fabric','Bottoms','College','Girls',450.00,35,NULL,'[\"24\",\"26\",\"28\",\"30\",\"32\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(17,'BSN Nursing Male Scrub Set','Official clinical scrubs top and cargo pants for male nursing students','Tops','College','Boys',850.00,29,NULL,'[\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 04:05:11'),(18,'BSCrim Criminology Uniform','Type A / Type B duty uniform for College of Criminology','Tops','College','Unisex',650.00,40,NULL,'[\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(19,'BSHM Hospitality Service Uniform','Front-of-house service vest and white button-down uniform','Tops','College','Unisex',550.00,30,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(20,'BSCA Customs Admin Uniform','Official Customs Administration epaulette uniform polo','Tops','College','Unisex',480.00,24,NULL,'[\"S\",\"M\",\"L\",\"XL\"]',1,'2026-09-27 02:42:38','2026-09-27 04:05:11'),(21,'Elementary Polo','Elementary boys short-sleeve polo with Olivarez patch','Tops','Elementary','Boys',260.00,40,NULL,'[\"8\",\"10\",\"12\",\"14\",\"16\",\"18\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(22,'Elementary Blouse','Elementary girls blouse with green ribbon and logo','Tops','Elementary','Girls',270.00,40,NULL,'[\"8\",\"10\",\"12\",\"14\",\"16\",\"18\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(23,'Elementary Shorts / Pants','Dark green garterized boys shorts/pants for elementary','Bottoms','Elementary','Boys',250.00,35,NULL,'[\"20\",\"22\",\"24\",\"26\",\"28\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(24,'Elementary Skirt','Pleated dark green school skirt for elementary girls','Bottoms','Elementary','Girls',280.00,35,NULL,'[\"20\",\"22\",\"24\",\"26\",\"28\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(25,'Kinder Polo','Preschool/Kindergarten polo shirt with soft collar','Tops','Kindergarten','Boys',220.00,30,NULL,'[\"4\",\"6\",\"8\",\"10\",\"12\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(26,'Kinder Blouse','Preschool/Kindergarten blouse with peter-pan collar','Tops','Kindergarten','Girls',230.00,30,NULL,'[\"4\",\"6\",\"8\",\"10\",\"12\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(27,'Kinder Shorts','Soft garterized school shorts for kinder boys','Bottoms','Kindergarten','Boys',200.00,30,NULL,'[\"18\",\"20\",\"22\",\"24\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(28,'Kinder Jumper / Skirt','Preschool green jumper skirt with button straps','Bottoms','Kindergarten','Girls',240.00,30,NULL,'[\"18\",\"20\",\"22\",\"24\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(29,'Official PE Shirt','Moisture-wicking official Olivarez College PE dry-fit t-shirt','PE wear','All','Unisex',385.00,0,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\",\"XXL\",\"XXXL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(30,'Official PE Shorts','Breathable sports shorts with school crest and side stripe','PE wear','All','Unisex',250.00,50,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(31,'PE Jogging Pants','Official green athletic jogging pants with zippered pockets','PE wear','All','Unisex',380.00,45,NULL,'[\"XS\",\"S\",\"M\",\"L\",\"XL\",\"XXL\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(32,'ID Lace / Lanyard','Official green woven lanyard with Olivarez College logo and badge holder','Accessories','All','Unisex',50.00,150,NULL,'[\"Standard\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(33,'School Necktie','Official pre-tied green school necktie for uniform','Accessories','All','Unisex',150.00,80,NULL,'[\"Standard\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38'),(34,'School Patch / Crest','Official embroidered Olivarez College school seal patch for iron-on or stitch','Accessories','All','Unisex',30.00,200,NULL,'[\"Standard\"]',1,'2026-09-27 02:42:38','2026-09-27 02:42:38');

INSERT INTO orders VALUES (1,'OL-1042','232C-0018','Pending',1040.00,'Wednesday, Oct 1','09:00 AM - 11:00 AM','Pay at Counter / Cashier',NULL,'2026-09-27 04:05:11','2026-09-27 04:05:11'),(2,'OL-1088','232C-0018','Pending',980.00,'Thursday, Oct 2','01:00 PM - 03:00 PM','Pay at Counter / Cashier',NULL,'2026-09-27 04:05:20','2026-09-27 04:05:20');

INSERT INTO order_items VALUES (1,1,17,'M',1,520.00),(2,1,20,'M',1,520.00),(3,2,11,'L',2,490.00);


SELECT setval('school_records_id_seq', (SELECT COALESCE(MAX(id), 1) FROM school_records));
SELECT setval('staff_users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM staff_users));
SELECT setval('students_id_seq', (SELECT COALESCE(MAX(id), 1) FROM students));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders));
SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM order_items));

ALTER TABLE products ADD COLUMN IF NOT EXISTS course_strand VARCHAR(60) DEFAULT 'All';
UPDATE products SET course_strand = 'BSN' WHERE id IN (15, 16, 17);
UPDATE products SET course_strand = 'BSCrim' WHERE id = 18;
UPDATE products SET course_strand = 'BSHM' WHERE id = 19;
UPDATE products SET course_strand = 'BSCA' WHERE id = 20;
UPDATE products SET course_strand = 'General College' WHERE id IN (11, 12, 13, 14);
UPDATE products SET course_strand = 'TVL' WHERE id IN (9, 10);
