// Seed & verify Supabase tables for Olivarez College Uniform Store Supply
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://eqsghtvevhxqtcaecbzc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxc2dodHZldmh4cXRjYWVjYnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDI4MjIsImV4cCI6MjEwODI3ODgyMn0.o96xh5RrmP3PUGwV4Dg94nwDvMvZdSC-hFTJ9KIrzqk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const schoolRecords = [
  { id: 2, student_id: "2024-00002", last_name: "Santos", first_name: "Maria", middle_name: null, year_level: "2nd Year", course: "BSN", is_active: 1 },
  { id: 3, student_id: "2024-00003", last_name: "Reyes", first_name: "Pedro", middle_name: null, year_level: "3rd Year", course: "BSBA", is_active: 1 },
  { id: 4, student_id: "2024-00004", last_name: "Garcia", first_name: "Ana", middle_name: null, year_level: "1st Year", course: "BSE", is_active: 1 },
  { id: 5, student_id: "2024-00005", last_name: "Mendoza", first_name: "Jose", middle_name: null, year_level: "4th Year", course: "BSCS", is_active: 1 },
  { id: 6, student_id: "2024-00006", last_name: "Torres", first_name: "Luz", middle_name: null, year_level: "2nd Year", course: "BSHRM", is_active: 1 },
  { id: 7, student_id: "2024-00007", last_name: "Bautista", first_name: "Carlo", middle_name: null, year_level: "1st Year", course: "BSIT", is_active: 1 },
  { id: 8, student_id: "2024-00008", last_name: "Aquino", first_name: "Rosa", middle_name: null, year_level: "3rd Year", course: "BSN", is_active: 1 },
  { id: 9, student_id: "232C-0018", last_name: "Fernan", first_name: "Josh Carl", middle_name: null, year_level: "College - 4th Year", course: "BSIT", is_active: 1 },
];

const staffUsers = [
  {
    id: 1,
    username: "staff01",
    full_name: "Store Releasing Staff",
    email: "staff@olivarezcollege.edu.ph",
    password_hash: "Staff2026!",
    role: "Store Staff",
    station: "Counter 01",
    is_active: 1,
  },
  {
    id: 2,
    username: "admin",
    full_name: "Uniform Store Administrator",
    email: "admin@olivarezcollege.edu.ph",
    password_hash: "Admin2026!",
    role: "Super Admin",
    station: "Main Office",
    is_active: 1,
  },
];

const students = [
  {
    id: 1,
    student_id: "232C-0018",
    last_name: "Fernan",
    first_name: "Josh Carl",
    email: "joshcarl.fernan@olivarezcollege.edu.ph",
    mobile: "09310249079",
    password_hash: "Olivarez2026!",
    gender: "Boys",
    year_level: "College - 4th Year",
    department: "College",
    course_strand: "BSIT",
    size_blouse: "M",
    size_skirt: null,
    size_pants: "32",
    size_pe_shirt: "L",
    is_verified: 1,
  },
  {
    id: 3,
    student_id: "231S-0042",
    last_name: "Santos",
    first_name: "Maria",
    email: "maria.santos@olivarezcollege.edu.ph",
    mobile: "09171234567",
    password_hash: "Olivarez2026!",
    gender: "Girls",
    year_level: "Grade 11",
    department: "Senior High",
    course_strand: "STEM",
    size_blouse: "S",
    size_skirt: "26",
    size_pants: null,
    size_pe_shirt: "M",
    is_verified: 1,
  },
];

const products = [
  { id: 1, name: "Girls' blouse, Junior High", description: "Official Olivarez College junior high blouse with green piping and school crest", category: "Tops", department: "Junior High", gender: "Girls", price: 385.00, stock: 50, image_url: null, sizes: '["XS","S","M","L","XL","XXL"]', is_active: 1 },
  { id: 2, name: "Girls' skirt, Junior High", description: "Official pleated green plaid school skirt with zipper and inner lining", category: "Bottoms", department: "Junior High", gender: "Girls", price: 385.00, stock: 40, image_url: null, sizes: '["24","26","28","30","32","34"]', is_active: 1 },
  { id: 3, name: "Men's blouse / polo, Junior High", description: "Official junior high polo shirt with school embroidery and collar piping", category: "Tops", department: "Junior High", gender: "Boys", price: 295.00, stock: 45, image_url: null, sizes: '["XS","S","M","L","XL","XXL"]', is_active: 1 },
  { id: 4, name: "School Pants, Junior High", description: "Official junior high dark green school trousers", category: "Bottoms", department: "Junior High", gender: "Boys", price: 350.00, stock: 45, image_url: null, sizes: '["26","28","30","32","34"]', is_active: 1 },
  { id: 5, name: "SHS Blouse", description: "Official Olivarez Senior High school blouse with embroidered logo", category: "Tops", department: "Senior High", gender: "Girls", price: 395.00, stock: 50, image_url: null, sizes: '["XS","S","M","L","XL","XXL"]', is_active: 1 },
  { id: 6, name: "SHS Skirt", description: "Official Senior High pleated school skirt", category: "Bottoms", department: "Senior High", gender: "Girls", price: 395.00, stock: 45, image_url: null, sizes: '["24","26","28","30","32","34"]', is_active: 1 },
  { id: 7, name: "SHS Polo-Barong", description: "Official Senior High embroidered polo-barong uniform", category: "Tops", department: "Senior High", gender: "Boys", price: 320.00, stock: 50, image_url: null, sizes: '["XS","S","M","L","XL","XXL"]', is_active: 1 },
  { id: 8, name: "SHS Slacks", description: "Official Senior High school slacks / trousers", category: "Bottoms", department: "Senior High", gender: "Boys", price: 380.00, stock: 40, image_url: null, sizes: '["26","28","30","32","34","36"]', is_active: 1 },
  { id: 9, name: "SHS TVL Culinary Jacket", description: "Double-breasted white chef jacket with Olivarez TVL emblem", category: "Tops", department: "Senior High", gender: "Unisex", price: 500.00, stock: 30, image_url: null, sizes: '["XS","S","M","L","XL"]', is_active: 1 },
  { id: 10, name: "Culinary Houndstooth Pants", description: "Comfort-fit culinary kitchen pants with drawstring", category: "Bottoms", department: "Senior High", gender: "Unisex", price: 420.00, stock: 30, image_url: null, sizes: '["XS","S","M","L","XL"]', is_active: 1 },
  { id: 11, name: "College Polo-Barong", description: "Official Olivarez College polo-barong with school seal embroidery", category: "Tops", department: "College", gender: "Boys", price: 350.00, stock: 58, image_url: null, sizes: '["XS","S","M","L","XL","XXL"]', is_active: 1 },
  { id: 12, name: "College Blouse", description: "Official Olivarez College corporate style female uniform blouse", category: "Tops", department: "College", gender: "Girls", price: 385.00, stock: 60, image_url: null, sizes: '["XS","S","M","L","XL","XXL"]', is_active: 1 },
  { id: 13, name: "College Slacks", description: "Official Olivarez College formal black/dark trousers", category: "Bottoms", department: "College", gender: "Boys", price: 400.00, stock: 50, image_url: null, sizes: '["28","30","32","34","36","38"]', is_active: 1 },
  { id: 14, name: "College Skirt", description: "Official Olivarez College corporate pencil/A-line skirt", category: "Bottoms", department: "College", gender: "Girls", price: 395.00, stock: 50, image_url: null, sizes: '["24","26","28","30","32","34"]', is_active: 1 },
  { id: 15, name: "BSN Nursing White Duty Top", description: "Official white clinical uniform top with embroidered OC college seal", category: "Tops", department: "College", gender: "Girls", price: 480.00, stock: 35, image_url: null, sizes: '["XS","S","M","L","XL"]', is_active: 1 },
  { id: 16, name: "BSN Nursing Duty Pants", description: "Official white clinical trousers with stain-resistant fabric", category: "Bottoms", department: "College", gender: "Girls", price: 450.00, stock: 35, image_url: null, sizes: '["24","26","28","30","32"]', is_active: 1 },
  { id: 17, name: "BSN Nursing Male Scrub Set", description: "Official clinical scrubs top and cargo pants for male nursing students", category: "Tops", department: "College", gender: "Boys", price: 850.00, stock: 29, image_url: null, sizes: '["S","M","L","XL","XXL"]', is_active: 1 },
  { id: 18, name: "BSCrim Criminology Uniform", description: "Type A / Type B duty uniform for College of Criminology", category: "Tops", department: "College", gender: "Unisex", price: 650.00, stock: 40, image_url: null, sizes: '["S","M","L","XL","XXL"]', is_active: 1 },
  { id: 19, name: "BSHM Hospitality Service Uniform", description: "Front-of-house service vest and white button-down uniform", category: "Tops", department: "College", gender: "Unisex", price: 550.00, stock: 30, image_url: null, sizes: '["XS","S","M","L","XL"]', is_active: 1 },
  { id: 20, name: "BSCA Customs Admin Uniform", description: "Official Customs Administration epaulette uniform polo", category: "Tops", department: "College", gender: "Unisex", price: 480.00, stock: 24, image_url: null, sizes: '["S","M","L","XL"]', is_active: 1 },
  { id: 21, name: "Elementary Polo", description: "Elementary boys short-sleeve polo with Olivarez patch", category: "Tops", department: "Elementary", gender: "Boys", price: 260.00, stock: 40, image_url: null, sizes: '["8","10","12","14","16","18"]', is_active: 1 },
  { id: 22, name: "Elementary Blouse", description: "Elementary girls blouse with green ribbon and logo", category: "Tops", department: "Elementary", gender: "Girls", price: 270.00, stock: 40, image_url: null, sizes: '["8","10","12","14","16","18"]', is_active: 1 },
  { id: 23, name: "Elementary Shorts / Pants", description: "Dark green garterized boys shorts/pants for elementary", category: "Bottoms", department: "Elementary", gender: "Boys", price: 250.00, stock: 35, image_url: null, sizes: '["20","22","24","26","28"]', is_active: 1 },
  { id: 24, name: "Elementary Skirt", description: "Pleated dark green school skirt for elementary girls", category: "Bottoms", department: "Elementary", gender: "Girls", price: 280.00, stock: 35, image_url: null, sizes: '["20","22","24","26","28"]', is_active: 1 },
  { id: 25, name: "Kinder Polo", description: "Preschool/Kindergarten polo shirt with soft collar", category: "Tops", department: "Kindergarten", gender: "Boys", price: 220.00, stock: 30, image_url: null, sizes: '["4","6","8","10","12"]', is_active: 1 },
  { id: 26, name: "Kinder Blouse", description: "Preschool/Kindergarten blouse with peter-pan collar", category: "Tops", department: "Kindergarten", gender: "Girls", price: 230.00, stock: 30, image_url: null, sizes: '["4","6","8","10","12"]', is_active: 1 },
  { id: 27, name: "Kinder Shorts", description: "Soft garterized school shorts for kinder boys", category: "Bottoms", department: "Kindergarten", gender: "Boys", price: 200.00, stock: 30, image_url: null, sizes: '["18","20","22","24"]', is_active: 1 },
  { id: 28, name: "Kinder Jumper / Skirt", description: "Preschool green jumper skirt with button straps", category: "Bottoms", department: "Kindergarten", gender: "Girls", price: 240.00, stock: 30, image_url: null, sizes: '["18","20","22","24"]', is_active: 1 },
  { id: 29, name: "Official PE Shirt", description: "Moisture-wicking official Olivarez College PE dry-fit t-shirt", category: "PE wear", department: "All", gender: "Unisex", price: 385.00, stock: 40, image_url: null, sizes: '["XS","S","M","L","XL","XXL","XXXL"]', is_active: 1 },
  { id: 30, name: "Official PE Shorts", description: "Breathable sports shorts with school crest and side stripe", category: "PE wear", department: "All", gender: "Unisex", price: 250.00, stock: 50, image_url: null, sizes: '["XS","S","M","L","XL","XXL"]', is_active: 1 },
  { id: 31, name: "PE Jogging Pants", description: "Official green athletic jogging pants with zippered pockets", category: "PE wear", department: "All", gender: "Unisex", price: 380.00, stock: 45, image_url: null, sizes: '["XS","S","M","L","XL","XXL"]', is_active: 1 },
  { id: 32, name: "ID Lace / Lanyard", description: "Official green woven lanyard with Olivarez College logo and badge holder", category: "Accessories", department: "All", gender: "Unisex", price: 50.00, stock: 150, image_url: null, sizes: '["Standard"]', is_active: 1 },
  { id: 33, name: "School Necktie", description: "Official pre-tied green school necktie for uniform", category: "Accessories", department: "All", gender: "Unisex", price: 150.00, stock: 80, image_url: null, sizes: '["Standard"]', is_active: 1 },
  { id: 34, name: "School Patch / Crest", description: "Official embroidered Olivarez College school seal patch for iron-on or stitch", category: "Accessories", department: "All", gender: "Unisex", price: 30.00, stock: 200, image_url: null, sizes: '["Standard"]', is_active: 1 },
];

const orders = [
  { id: 1, order_code: "OL-1042", student_id: "232C-0018", status: "Pending", total_amount: 1040.00, pickup_day: "Wednesday, Oct 1", time_slot: "09:00 AM - 11:00 AM", payment_method: "Pay at Counter / Cashier", notes: null },
  { id: 2, order_code: "OL-1088", student_id: "232C-0018", status: "Pending", total_amount: 980.00, pickup_day: "Thursday, Oct 2", time_slot: "01:00 PM - 03:00 PM", payment_method: "Pay at Counter / Cashier", notes: null },
];

const orderItems = [
  { id: 1, order_id: 1, product_id: 17, size: "M", quantity: 1, unit_price: 520.00 },
  { id: 2, order_id: 1, product_id: 20, size: "M", quantity: 1, unit_price: 520.00 },
  { id: 3, order_id: 2, product_id: 11, size: "L", quantity: 2, unit_price: 490.00 },
];

async function runSeed() {
  const steps = [
    ["school_records", schoolRecords, "id"],
    ["staff_users", staffUsers, "id"],
    ["students", students, "id"],
    ["products", products, "id"],
    ["orders", orders, "id"],
    ["order_items", orderItems, "id"],
  ];

  for (const [table, rows, onConflict] of steps) {
    const { data, error } = await supabase
      .from(table)
      .upsert(rows, { onConflict })
      .select();
    if (error) {
      console.error(`ERROR seeding ${table}:`, error.code, error.message, error.details);
    } else {
      console.log(`SEEDED ${table}: ${data ? data.length : 0} rows`);
    }
  }
}

runSeed();
