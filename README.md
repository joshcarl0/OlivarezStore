# Olivarez College - Uniform Store Supply (Mobile App & Backend)

Official mobile e-commerce and uniform ordering system for **Olivarez College Parañaque**.

## 📌 Features
- **Modern Bento UI**: Olivarez green (`#1a5c2e`) and gold (`#c9a84c`) design aesthetics.
- **Role & Gender-Based Catalog**: Dynamically tailored uniform offerings for Kindergarten, Elementary, JHS, SHS (STEM, ABM, HUMSS, GAS, TVL-Culinary), and College (CCASE, CCBALTCH, CHSE - BSN, BSCrim, BSHM, BSCA, etc.) for both Boys and Girls.
- **Institutional Email Verification**: Verification code via Google SMTP sent to student's `@olivarezcollege.edu.ph` email.
- **Flexible Authentication**: Students can sign in using their **Student ID** (e.g. `232C-0018`) or their institutional email.
- **Interactive Cart & Checkout**: Choose pickup day schedule, pickup time slots, and payment method (Cash at Cashier / Counter).
- **Claim Ticket & QR Code**: Green order pass generated upon order placement (e.g. `OL-1042`).

---

## 🏗️ Project Structure
```
olivarez-store/
├── src/
│   ├── components/      # Common UI components
│   ├── config/          # API endpoints & base URL
│   ├── context/         # Cart & State management
│   ├── screens/         # Login, Register, Home, Shop, ProductDetail, Cart, Checkout, OrderSuccess
│   └── utils/           # Security, validation, formatting
├── backend_api/         # PHP Backend APIs (XAMPP htdocs)
│   ├── config.php       # DB connection
│   ├── login.php        # Student authentication
│   ├── register.php     # Student registration with email dispatch
│   ├── mailer.php       # Standalone Google SMTP socket mailer
│   ├── products.php     # Catalog API with gender/dept filters
│   ├── place_order.php  # Order placement
│   ├── get_orders.php   # Student order history
│   └── verify_otp.php   # OTP verification
├── database/
│   └── olivarez_store.sql # Complete MySQL database dump
└── assets/              # App icons, Olivarez seal, illustrations
```

---

## 🚀 Getting Started

### 1. Database & Backend Setup
1. Start **Apache** and **MySQL** in XAMPP.
2. Import `database/olivarez_store.sql` into MySQL (`olivarez_store` database).
3. Copy contents of `backend_api/` into `C:/xampp/htdocs/olivarez_api/`.

### 2. Mobile App Setup
```bash
# Install dependencies
npm install

# Start development server
npx expo start
```
