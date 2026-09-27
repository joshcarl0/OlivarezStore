/**
 * Olivarez College — Student Uniform Portal App
 * Universal Client: Works on localhost, LAN (192.168.100.5), and Localtunnel
 */

const API_BASE = window.location.origin + "/olivarez_api";

// State
let currentStudent = null;
let allProducts = [];
let allOrders = [];
let activeCategoryFilter = "MyCourse";
let selectedRegisterSize = "M";
let activeModalProduct = null;
let pendingStudentId = "";

// DOM Elements
const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const guestNav = document.getElementById("guestNav");
const userNav = document.getElementById("userNav");
const studentAvatar = document.getElementById("studentAvatar");
const studentName = document.getElementById("studentName");
const studentDeptTag = document.getElementById("studentDeptTag");
const btnLogout = document.getElementById("btnLogout");

// Tabs in Auth
const tabBtnLogin = document.getElementById("tabBtnLogin");
const tabBtnRegister = document.getElementById("tabBtnRegister");
const loginFormPane = document.getElementById("loginFormPane");
const registerFormPane = document.getElementById("registerFormPane");

// Login Elements
const studentLoginForm = document.getElementById("studentLoginForm");
const loginIdentifier = document.getElementById("loginIdentifier");
const loginPassword = document.getElementById("loginPassword");
const btnLoginSubmit = document.getElementById("btnLoginSubmit");

// Wizard Elements
const bubbleStep1 = document.getElementById("bubbleStep1");
const bubbleStep2 = document.getElementById("bubbleStep2");
const bubbleStep3 = document.getElementById("bubbleStep3");
const regStep1 = document.getElementById("regStep1");
const regStep2 = document.getElementById("regStep2");
const regStep3 = document.getElementById("regStep3");

// Inputs Step 1
const regStudentId = document.getElementById("regStudentId");
const regMobile = document.getElementById("regMobile");
const regFirstName = document.getElementById("regFirstName");
const regLastName = document.getElementById("regLastName");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const btnNextStep1 = document.getElementById("btnNextStep1");

// Inputs Step 2
const regDept = document.getElementById("regDept");
const regCourse = document.getElementById("regCourse");
const regGender = document.getElementById("regGender");
const regYearLevel = document.getElementById("regYearLevel");
const btnBackStep2 = document.getElementById("btnBackStep2");
const btnSubmitRegistration = document.getElementById("btnSubmitRegistration");
const sizeBtns = document.querySelectorAll(".size-choice-btn");

// Step 3 (OTP)
const otpTargetEmail = document.getElementById("otpTargetEmail");
const regOtpInput = document.getElementById("regOtpInput");
const btnVerifyOtp = document.getElementById("btnVerifyOtp");
const btnResendOtp = document.getElementById("btnResendOtp");

// Dashboard Elements
const dashGreeting = document.getElementById("dashGreeting");
const dashCourseSub = document.getElementById("dashCourseSub");
const dashStudentId = document.getElementById("dashStudentId");
const dashTabCatalog = document.getElementById("dashTabCatalog");
const dashTabOrders = document.getElementById("dashTabOrders");
const dashCatalogPane = document.getElementById("dashCatalogPane");
const dashOrdersPane = document.getElementById("dashOrdersPane");
const studentProductsGrid = document.getElementById("studentProductsGrid");
const studentOrdersList = document.getElementById("studentOrdersList");
const catalogSearch = document.getElementById("catalogSearch");
const catChips = document.querySelectorAll(".cat-chip");

// Order Modal Elements
const orderModal = document.getElementById("orderModal");
const btnOrderModalClose = document.getElementById("btnOrderModalClose");
const btnCancelOrderModal = document.getElementById("btnCancelOrderModal");
const modalItemName = document.getElementById("modalItemName");
const modalItemPrice = document.getElementById("modalItemPrice");
const modalSizeChips = document.getElementById("modalSizeChips");
const modalPickupDay = document.getElementById("modalPickupDay");
const modalTimeSlot = document.getElementById("modalTimeSlot");
const btnConfirmPlaceOrder = document.getElementById("btnConfirmPlaceOrder");
let selectedOrderSize = "M";

// Toast helper
function showToast(msg, isError = false) {
  const toast = document.getElementById("studentToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.background = isError ? "#c53030" : "#0d5c3a";
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// ─────────────────────────────────────────────────────────────
// 1. NAVIGATION & TAB SWITCHING
// ─────────────────────────────────────────────────────────────
window.switchToLogin = function() {
  tabBtnLogin.classList.add("active");
  tabBtnRegister.classList.remove("active");
  loginFormPane.classList.add("active");
  registerFormPane.classList.remove("active");
};

window.switchToRegister = function() {
  tabBtnRegister.classList.add("active");
  tabBtnLogin.classList.remove("active");
  registerFormPane.classList.add("active");
  loginFormPane.classList.remove("active");
};

tabBtnLogin.addEventListener("click", window.switchToLogin);
tabBtnRegister.addEventListener("click", window.switchToRegister);

// Check URL Hash (e.g. /student_portal/#register)
if (window.location.hash === "#register") {
  window.switchToRegister();
}

// Demo Credentials Filler
window.fillDemo = function(id, pw) {
  loginIdentifier.value = id;
  loginPassword.value = pw;
  showToast("Demo credentials filled! Click 'Sign In' to proceed.");
};

// ─────────────────────────────────────────────────────────────
// 2. REGISTRATION WIZARD LOGIC
// ─────────────────────────────────────────────────────────────
sizeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    sizeBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedRegisterSize = btn.dataset.size || "M";
  });
});

// Step 1 -> Step 2
btnNextStep1.addEventListener("click", () => {
  const idVal = regStudentId.value.trim();
  const mobVal = regMobile.value.trim();
  const fnVal = regFirstName.value.trim();
  const lnVal = regLastName.value.trim();
  const emVal = regEmail.value.trim();
  const pwVal = regPassword.value;

  if (!idVal || !mobVal || !fnVal || !lnVal || !emVal || !pwVal) {
    showToast("Please fill in all required fields in Step 1.", true);
    return;
  }
  if (pwVal.length < 8) {
    showToast("Password must be at least 8 characters long.", true);
    return;
  }

  // Go to step 2
  regStep1.classList.remove("active");
  regStep2.classList.add("active");
  bubbleStep1.classList.remove("active");
  bubbleStep2.classList.add("active");
});

// Step 2 -> Step 1 (Back)
btnBackStep2.addEventListener("click", () => {
  regStep2.classList.remove("active");
  regStep1.classList.add("active");
  bubbleStep2.classList.remove("active");
  bubbleStep1.classList.add("active");
});

// Step 2 -> Submit Registration (Call Backend & Send OTP)
btnSubmitRegistration.addEventListener("click", async () => {
  btnSubmitRegistration.disabled = true;
  btnSubmitRegistration.innerHTML = "<span>Sending Verification Code...</span>";

  const payload = {
    student_id: regStudentId.value.trim(),
    first_name: regFirstName.value.trim(),
    last_name: regLastName.value.trim(),
    email: regEmail.value.trim(),
    mobile: regMobile.value.trim(),
    password: regPassword.value,
    department: regDept.value,
    course_strand: regCourse.value,
    gender: regGender.value,
    year_level: regYearLevel.value,
    size_blouse: selectedRegisterSize,
    size_skirt: selectedRegisterSize,
    size_pants: selectedRegisterSize,
    size_pe_shirt: selectedRegisterSize
  };

  try {
    const res = await fetch(`${API_BASE}/register.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.error || result.message || "Registration failed");
    }

    pendingStudentId = payload.student_id;
    otpTargetEmail.textContent = result.data.email || payload.email;

    // Show debug OTP hint for smooth testing
    if (result.data.otp_debug) {
      regOtpInput.value = result.data.otp_debug;
      showToast(`Verification code sent! (Demo OTP: ${result.data.otp_debug})`);
    } else {
      showToast("Verification code dispatched to your email!");
    }

    // Advance to Step 3
    regStep2.classList.remove("active");
    regStep3.classList.add("active");
    bubbleStep2.classList.remove("active");
    bubbleStep3.classList.add("active");

  } catch (err) {
    showToast(err.message, true);
  } finally {
    btnSubmitRegistration.disabled = false;
    btnSubmitRegistration.innerHTML = "<span>Submit & Send Verification Code</span>";
  }
});

// Step 3 -> Verify OTP
btnVerifyOtp.addEventListener("click", async () => {
  const otpVal = regOtpInput.value.trim();
  if (!otpVal || otpVal.length < 6) {
    showToast("Please enter the complete 6-digit code.", true);
    return;
  }

  btnVerifyOtp.disabled = true;
  btnVerifyOtp.innerHTML = "<span>Verifying Account...</span>";

  try {
    const res = await fetch(`${API_BASE}/verify_otp.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: pendingStudentId || regStudentId.value.trim(),
        otp: otpVal
      })
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.error || result.message || "Invalid OTP code");
    }

    showToast("Account activated successfully! Logging you in...");

    // Auto log in with newly registered credentials
    setTimeout(async () => {
      await performLogin(pendingStudentId || regStudentId.value.trim(), regPassword.value);
    }, 800);

  } catch (err) {
    showToast(err.message, true);
  } finally {
    btnVerifyOtp.disabled = false;
    btnVerifyOtp.innerHTML = "<span>Verify & Activate Account</span>";
  }
});

// Resend OTP
btnResendOtp.addEventListener("click", () => {
  showToast("Code resent! Please check your inbox or spam folder.");
});

// ─────────────────────────────────────────────────────────────
// 3. STUDENT LOGIN
// ─────────────────────────────────────────────────────────────
studentLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idVal = loginIdentifier.value.trim();
  const pwVal = loginPassword.value;

  if (!idVal || !pwVal) {
    showToast("Please enter your Student ID / Email and password.", true);
    return;
  }

  btnLoginSubmit.disabled = true;
  btnLoginSubmit.innerHTML = "<span>Signing in...</span>";

  await performLogin(idVal, pwVal);

  btnLoginSubmit.disabled = false;
  btnLoginSubmit.innerHTML = "<span>Sign In to Student Portal</span>";
});

async function performLogin(identifier, password) {
  try {
    const res = await fetch(`${API_BASE}/login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.error || result.message || "Login failed");
    }

    currentStudent = result.data.student;
    sessionStorage.setItem("olivarez_student_user", JSON.stringify(currentStudent));

    showToast(`Welcome back, ${currentStudent.first_name}!`);
    renderStudentView();

  } catch (err) {
    showToast(err.message, true);
  }
}

// ─────────────────────────────────────────────────────────────
// 4. RENDER DASHBOARD & USER VIEW
// ─────────────────────────────────────────────────────────────
function renderStudentView() {
  if (!currentStudent) return;

  // Switch View
  authSection.style.display = "none";
  dashboardSection.style.display = "block";

  // Topbar Updates
  guestNav.style.display = "none";
  userNav.style.display = "flex";

  const initials = `${currentStudent.first_name?.[0] || ""}${currentStudent.last_name?.[0] || ""}`.toUpperCase();
  studentAvatar.textContent = initials || "ST";
  studentName.textContent = `${currentStudent.first_name} ${currentStudent.last_name}`;
  studentDeptTag.textContent = `${currentStudent.course_strand || "Student"} • ${currentStudent.department || "College"}`;

  // Dashboard Banner
  dashGreeting.textContent = `Welcome, ${currentStudent.first_name}!`;
  dashCourseSub.textContent = `Enrolled in: ${currentStudent.course_strand || "General"} (${currentStudent.department || "College"}) • Year: ${currentStudent.year_level || "1st Year"}`;
  dashStudentId.textContent = currentStudent.student_id;

  // Update button label on filter chip
  const myCourseChip = document.getElementById("btnMyCourseChip");
  if (myCourseChip && currentStudent.course_strand) {
    myCourseChip.textContent = `My Course (${currentStudent.course_strand})`;
  }

  // Load Catalog & Orders
  loadProducts();
  loadOrders();
}

// Logout
btnLogout.addEventListener("click", () => {
  sessionStorage.removeItem("olivarez_student_user");
  currentStudent = null;
  userNav.style.display = "none";
  guestNav.style.display = "block";
  dashboardSection.style.display = "none";
  authSection.style.display = "block";
  window.switchToLogin();
  showToast("You have been signed out.");
});

// Dashboard Tab Switching (Catalog vs Orders)
dashTabCatalog.addEventListener("click", () => {
  dashTabCatalog.classList.add("active");
  dashTabOrders.classList.remove("active");
  dashCatalogPane.classList.add("active");
  dashOrdersPane.classList.remove("active");
});

dashTabOrders.addEventListener("click", () => {
  dashTabOrders.classList.add("active");
  dashTabCatalog.classList.remove("active");
  dashOrdersPane.classList.add("active");
  dashCatalogPane.classList.remove("active");
  loadOrders();
});

// Category Filter Chips
catChips.forEach(chip => {
  chip.addEventListener("click", () => {
    catChips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    activeCategoryFilter = chip.dataset.filter || "All";
    filterAndRenderProducts();
  });
});

catalogSearch.addEventListener("input", () => {
  filterAndRenderProducts();
});

// ─────────────────────────────────────────────────────────────
// 5. PRODUCTS & UNIFORMS CATALOG
// ─────────────────────────────────────────────────────────────
async function loadProducts() {
  studentProductsGrid.innerHTML = `<div class="skeleton-card">Loading uniforms catalog...</div>`;
  try {
    const res = await fetch(`${API_BASE}/products.php`);
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      allProducts = result.data;
      filterAndRenderProducts();
    } else {
      studentProductsGrid.innerHTML = `<div class="skeleton-card">No uniforms found.</div>`;
    }
  } catch (err) {
    studentProductsGrid.innerHTML = `<div class="skeleton-card">Failed to load uniforms. Please check connection.</div>`;
  }
}

function filterAndRenderProducts() {
  const query = catalogSearch.value.trim().toLowerCase();
  const studentCourse = (currentStudent?.course_strand || "").toLowerCase();

  const filtered = allProducts.filter(item => {
    // 1. Text Search Filter
    const nameMatch = (item.name || "").toLowerCase().includes(query);
    const catMatch = (item.category || "").toLowerCase().includes(query);
    const courseMatch = (item.course_strand || "").toLowerCase().includes(query);
    const matchesQuery = !query || nameMatch || catMatch || courseMatch;

    if (!matchesQuery) return false;

    // 2. Category / Course Chip Filter
    if (activeCategoryFilter === "All") return true;

    if (activeCategoryFilter === "MyCourse") {
      if (!studentCourse) return true;
      const itemCourse = (item.course_strand || "").toLowerCase();
      // Items that match student course, or General / PE items
      return itemCourse === studentCourse || itemCourse === "general" || (item.category || "").toLowerCase().includes("pe");
    }

    if (activeCategoryFilter === "Tops") {
      return (item.category || "").toLowerCase().includes("top") || (item.category || "").toLowerCase().includes("blouse") || (item.category || "").toLowerCase().includes("shirt");
    }

    if (activeCategoryFilter === "Bottoms") {
      return (item.category || "").toLowerCase().includes("bottom") || (item.category || "").toLowerCase().includes("pants") || (item.category || "").toLowerCase().includes("skirt");
    }

    if (activeCategoryFilter === "PE wear") {
      return (item.category || "").toLowerCase().includes("pe");
    }

    if (activeCategoryFilter === "Accessories") {
      return (item.category || "").toLowerCase().includes("access") || (item.category || "").toLowerCase().includes("cap") || (item.category || "").toLowerCase().includes("pin") || (item.category || "").toLowerCase().includes("patch");
    }

    return true;
  });

  if (filtered.length === 0) {
    studentProductsGrid.innerHTML = `
      <div class="empty-catalog-box">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>No matching uniforms found</h3>
        <p>Try switching filter tabs or searching for another term.</p>
      </div>
    `;
    return;
  }

  studentProductsGrid.innerHTML = filtered.map(item => {
    const photoUrl = item.image_url 
      ? (item.image_url.startsWith("http") ? item.image_url : window.location.origin + item.image_url)
      : null;

    const courseBadge = item.course_strand && item.course_strand !== "General"
      ? `<span class="product-badge course-badge">${item.course_strand}</span>`
      : `<span class="product-badge dept-badge">${item.department || "General"}</span>`;

    const stockBadge = (item.stock > 10)
      ? `<span class="stock-pill in-stock">In Stock (${item.stock})</span>`
      : `<span class="stock-pill low-stock">Low Stock (${item.stock})</span>`;

    const imgTag = photoUrl
      ? `<img src="${photoUrl}" alt="${item.name}" class="product-img" onerror="this.parentElement.innerHTML='<div class=\\'product-placeholder\\'>👔</div>'">`
      : `<div class="product-placeholder">👔</div>`;

    return `
      <div class="product-card">
        <div class="product-img-box">
          ${imgTag}
          <div class="product-badges-overlay">
            ${courseBadge}
            ${stockBadge}
          </div>
        </div>
        <div class="product-details">
          <div class="product-meta-row">
            <span class="product-category">${item.category || "Uniform"}</span>
            <span class="product-gender">${item.gender || "All"}</span>
          </div>
          <h3 class="product-title">${item.name}</h3>
          <p class="product-desc">${item.description || "Official Olivarez College prescribed uniform item."}</p>
          <div class="product-bottom-row">
            <div class="product-price">₱${parseFloat(item.price || 0).toFixed(2)}</div>
            <button class="btn-preorder" onclick="openOrderModal(${item.id})">
              <span>Pre-Order</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ─────────────────────────────────────────────────────────────
// 6. PRE-ORDER MODAL & ORDER PLACEMENT
// ─────────────────────────────────────────────────────────────
window.openOrderModal = function(productId) {
  const item = allProducts.find(p => p.id == productId);
  if (!item) return;

  activeModalProduct = item;
  modalItemName.textContent = item.name;
  modalItemPrice.textContent = `₱${parseFloat(item.price || 0).toFixed(2)}`;

  // Size chips
  const sizes = ["S", "M", "L", "XL", "2XL"];
  selectedOrderSize = currentStudent?.size_blouse || "M";

  modalSizeChips.innerHTML = sizes.map(sz => `
    <button type="button" class="size-chip ${sz === selectedOrderSize ? 'active' : ''}" onclick="selectModalSize('${sz}', this)">${sz}</button>
  `).join("");

  orderModal.classList.add("active");
};

window.selectModalSize = function(size, btn) {
  selectedOrderSize = size;
  document.querySelectorAll("#modalSizeChips .size-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
};

function closeOrderModal() {
  orderModal.classList.remove("active");
  activeModalProduct = null;
}

btnOrderModalClose.addEventListener("click", closeOrderModal);
btnCancelOrderModal.addEventListener("click", closeOrderModal);

btnConfirmPlaceOrder.addEventListener("click", async () => {
  if (!activeModalProduct || !currentStudent) return;

  btnConfirmPlaceOrder.disabled = true;
  btnConfirmPlaceOrder.textContent = "Placing Pre-Order...";

  const payload = {
    student_id: currentStudent.student_id,
    student_name: `${currentStudent.first_name} ${currentStudent.last_name}`,
    department: currentStudent.department || "College",
    course_strand: currentStudent.course_strand || "General",
    pickup_date: modalPickupDay.value,
    time_slot: modalTimeSlot.value,
    total_amount: activeModalProduct.price,
    items: [
      {
        product_id: activeModalProduct.id,
        product_name: activeModalProduct.name,
        size: selectedOrderSize,
        price: activeModalProduct.price,
        quantity: 1
      }
    ]
  };

  try {
    const res = await fetch(`${API_BASE}/place_order.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.error || result.message || "Failed to place order");
    }

    closeOrderModal();
    showToast("🎉 Order placed! Your digital claim slip is ready under 'My Claim Orders'.");

    // Switch to Orders tab & reload
    dashTabOrders.click();

  } catch (err) {
    showToast(err.message, true);
  } finally {
    btnConfirmPlaceOrder.disabled = false;
    btnConfirmPlaceOrder.textContent = "Confirm Pre-Order";
  }
});

// ─────────────────────────────────────────────────────────────
// 7. MY CLAIM ORDERS
// ─────────────────────────────────────────────────────────────
async function loadOrders() {
  if (!currentStudent) return;
  studentOrdersList.innerHTML = `<div class="skeleton-card">Loading claim orders...</div>`;

  try {
    const res = await fetch(`${API_BASE}/get_orders.php?student_id=${encodeURIComponent(currentStudent.student_id)}`);
    const result = await res.json();

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      allOrders = result.data;
      renderOrders();
    } else {
      studentOrdersList.innerHTML = `
        <div class="empty-orders-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <h3>No Orders Yet</h3>
          <p>Browse our uniform catalog and place your first pre-order for hassle-free counter pickup!</p>
          <button class="btn-submit" onclick="dashTabCatalog.click()" style="max-width:200px;margin-top:16px;">
            <span>Browse Uniforms</span>
          </button>
        </div>
      `;
    }
  } catch (err) {
    studentOrdersList.innerHTML = `<div class="skeleton-card">Failed to load orders.</div>`;
  }
}

function renderOrders() {
  studentOrdersList.innerHTML = allOrders.map(ord => {
    const statusClass = (ord.status || "").toLowerCase().replace(/\s+/g, "-");
    const formattedDate = ord.pickup_date || "To be scheduled";
    const formattedSlot = ord.time_slot || "Regular Store Hours";

    const itemsSummary = (ord.items && Array.isArray(ord.items))
      ? ord.items.map(it => `
          <div class="order-item-chip">
            <span class="item-name">${it.product_name}</span>
            <span class="item-size-tag">Size: ${it.size}</span>
            <span class="item-qty">x${it.quantity}</span>
            <span class="item-sub">₱${parseFloat(it.price * it.quantity).toFixed(2)}</span>
          </div>
        `).join("")
      : `<div class="order-item-chip">${ord.summary || "Uniform items"}</div>`;

    return `
      <div class="claim-slip-card">
        <div class="slip-header">
          <div>
            <div class="slip-order-num">CLAIM SLIP #${ord.order_number || ord.id}</div>
            <div class="slip-date">Placed: ${ord.created_at || "Recent"}</div>
          </div>
          <span class="status-pill status-${statusClass}">${ord.status || "Pending"}</span>
        </div>

        <div class="slip-schedule-banner">
          <div class="schedule-icon">📅</div>
          <div class="schedule-details">
            <div class="schedule-day">Pickup: <strong>${formattedDate}</strong></div>
            <div class="schedule-time">Time Slot: ${formattedSlot}</div>
          </div>
        </div>

        <div class="slip-items-list">
          <label class="slip-label">Ordered Items:</label>
          ${itemsSummary}
        </div>

        <div class="slip-footer">
          <div class="slip-total">
            <span>Total Payable at Counter:</span>
            <strong>₱${parseFloat(ord.total_amount || 0).toFixed(2)}</strong>
          </div>
          <div class="slip-barcode-box">
            <div class="fake-barcode">||| | |||| | ||| || ||||</div>
            <span class="barcode-code">${ord.order_number || ord.id}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ─────────────────────────────────────────────────────────────
// 8. AUTO-RESTORE SESSION
// ─────────────────────────────────────────────────────────────
const savedStudent = sessionStorage.getItem("olivarez_student_user");
if (savedStudent) {
  try {
    currentStudent = JSON.parse(savedStudent);
    renderStudentView();
  } catch (e) {
    sessionStorage.removeItem("olivarez_student_user");
  }
}
