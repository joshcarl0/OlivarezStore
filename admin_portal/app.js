// Olivarez College — Super Admin Executive Portal Logic
const API_BASE = "http://localhost/olivarez_api";

// State
let allProducts = [];
let allOrders = [];
let allStudents = [];
let allStaff = [];

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupCatalogFilters();
  setupProductModal();
  setupStockModal();
  setupStaffModal();
  setupStaffFilters();
  setupLoginModal();
  setupImageUploader();

  // Load initial data
  loadAnalytics();
  loadCatalog();
  loadOrders();
  loadUsers();

  document.getElementById("btnRefreshAnalytics")?.addEventListener("click", () => {
    loadAnalytics();
    showToast("Synced live data with database.");
  });
});

/* ── TOAST NOTIFICATIONS ── */
function showToast(message) {
  const toast = document.getElementById("adminToast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
}

/* ── NAVIGATION TABS ── */
function setupNavigation() {
  const navBtns = document.querySelectorAll(".nav-item");
  const panes = document.querySelectorAll(".tab-pane");

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      navBtns.forEach((b) => b.classList.remove("active"));
      panes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(`section${capitalize(tab)}`);
      if (targetPane) targetPane.classList.add("active");

      // Auto refresh on tab focus
      if (tab === "analytics") loadAnalytics();
      if (tab === "catalog") loadCatalog();
      if (tab === "orders") loadOrders();
      if (tab === "students" || tab === "staff") loadUsers();
    });
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── TAB 1: EXECUTIVE KPI & ANALYTICS ── */
async function loadAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/get_analytics.php`);
    const json = await res.json();
    if (!json.success || !json.data) return;

    const data = json.data;

    // KPI Counters
    document.getElementById("kpiTotalRevenue").textContent = `₱${formatMoney(data.revenue.total)}`;
    document.getElementById("kpiCompletedSales").textContent = `₱${formatMoney(data.revenue.completed)} Claimed`;
    document.getElementById("kpiPendingSales").textContent = `₱${formatMoney(data.revenue.pending)} Pending`;

    document.getElementById("kpiTotalOrders").textContent = data.orders.total;
    document.getElementById("kpiCompletedOrders").textContent = `${data.orders.completed} Completed`;
    document.getElementById("kpiPendingOrders").textContent = `${data.orders.pending} Pending Claim`;

    document.getElementById("kpiTotalProducts").textContent = data.inventory.total_products;
    document.getElementById("kpiLowStockCount").textContent = `${data.inventory.low_stock} Low Stock Alert`;

    document.getElementById("kpiTotalStudents").textContent = data.users.students;
    document.getElementById("kpiTotalStaff").textContent = `${data.users.staff} Staff Accounts`;

    // Render College Course Uniforms Breakdown
    renderCourseBreakdown(data.inventory.by_course || []);

    // Render Education Level Breakdown
    renderDeptBreakdown(data.inventory.by_department || []);

    // Render Low Stock Table
    renderLowStockTable(data.inventory.low_stock_items || []);

    // Render Recent Orders List
    renderRecentOrders(data.recent_orders || []);
  } catch (err) {
    console.error("Failed to load analytics:", err);
  }
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderCourseBreakdown(courses) {
  const container = document.getElementById("courseBreakdownList");
  if (!container) return;

  if (courses.length === 0) {
    container.innerHTML = `<div class="table-empty">No college course data found.</div>`;
    return;
  }

  // Find max stock for relative bar width
  const maxStock = Math.max(...courses.map((c) => parseInt(c.total_inventory || 0)), 100);

  const courseNames = {
    BSN: "Nursing (Duty Uniforms & Scrubs)",
    BSCrim: "Criminology (Drill Uniform)",
    BSHM: "Hospitality Management (Chef & Vest)",
    BSTM: "Tourism Management (Blazer & Scarf)",
    BSCA: "Customs Administration",
    BSRT: "Radiologic Technology (Scrubs)",
    "General College": "General College (Polo-Barong / Blouse)",
  };

  container.innerHTML = courses
    .map((c) => {
      const code = c.course_strand || "General";
      const badgeClass = code.replace(/\s+/g, "");
      const fullLabel = courseNames[code] || code;
      const count = c.count || 0;
      const stock = c.total_inventory || 0;
      const percent = Math.min(100, Math.round((stock / maxStock) * 100));

      return `
      <div class="course-item-row">
        <div class="course-row-head">
          <div>
            <span class="course-tag-badge ${badgeClass}">${code}</span>
            <strong style="color:var(--slate-800);">${fullLabel}</strong>
          </div>
          <span style="font-weight:700; color:var(--oc-green-700);">${stock} pcs in stock (${count} SKUs)</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderDeptBreakdown(depts) {
  const container = document.getElementById("deptBreakdownList");
  if (!container) return;

  if (depts.length === 0) {
    container.innerHTML = `<div class="table-empty">No department inventory found.</div>`;
    return;
  }

  const maxStock = Math.max(...depts.map((d) => parseInt(d.total_inventory || 0)), 100);

  container.innerHTML = depts
    .map((d) => {
      const name = d.department || "General";
      const stock = d.total_inventory || 0;
      const count = d.count || 0;
      const percent = Math.min(100, Math.round((stock / maxStock) * 100));

      return `
      <div class="course-item-row">
        <div class="course-row-head">
          <span style="font-weight:700; color:var(--slate-800);">${name}</span>
          <span style="font-weight:700; color:var(--slate-600);">${stock} pcs (${count} items)</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill" style="width: ${percent}%; background:#2563eb;"></div>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderLowStockTable(items) {
  const tbody = document.getElementById("lowStockTableBody");
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">All uniforms are currently well-stocked.</td></tr>`;
    return;
  }

  tbody.innerHTML = items
    .map((item) => {
      const stock = parseInt(item.stock || 0);
      const isCritical = stock <= 10;
      const badge = `<span class="meta-tag ${isCritical ? "red" : "orange"}">${stock} left</span>`;
      return `
      <tr>
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td><span class="course-tag-badge ${item.course_strand || ""}">${escapeHtml(item.course_strand || item.department)}</span></td>
        <td>₱${formatMoney(item.price)}</td>
        <td>${badge}</td>
        <td>
          <button class="btn-action-stock" onclick="openStockModal(${item.id}, '${escapeHtml(item.name)}', ${stock})">
            + Restock
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
}

function renderRecentOrders(orders) {
  const container = document.getElementById("recentOrdersList");
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<div class="table-empty">No recent orders placed yet.</div>`;
    return;
  }

  container.innerHTML = orders
    .map((o) => {
      const statusBadge = `<span class="status-badge ${o.status}">${o.status}</span>`;
      return `
      <div class="recent-order-item">
        <div class="order-meta-left">
          <span class="order-code-badge">${o.order_code || "#" + o.id}</span>
          <div>
            <div class="order-student-name">${escapeHtml(o.student_name || o.student_id)}</div>
            <div class="order-student-dept">${o.department || "College"} ${o.course_strand ? "• " + o.course_strand : ""}</div>
          </div>
        </div>
        <div class="order-meta-right">
          <div class="order-total-price">₱${formatMoney(o.total_amount)}</div>
          <div>${statusBadge}</div>
        </div>
      </div>
    `;
    })
    .join("");
}

/* ── TAB 2: CATALOG & COURSE TAGGING ── */
async function loadCatalog() {
  const container = document.getElementById("productsGrid");
  try {
    const res = await fetch(`${API_BASE}/get_inventory.php`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return;

    allProducts = json.data;
    applyCatalogFilters();
  } catch (err) {
    console.error("Failed to load catalog:", err);
    if (container) container.innerHTML = `<div class="table-empty">Failed to load uniforms from API.</div>`;
  }
}

function setupCatalogFilters() {
  const searchInput = document.getElementById("catalogSearchInput");
  const deptSelect = document.getElementById("catalogDeptSelect");
  const courseSelect = document.getElementById("catalogCourseSelect");

  searchInput?.addEventListener("input", applyCatalogFilters);
  deptSelect?.addEventListener("change", applyCatalogFilters);
  courseSelect?.addEventListener("change", applyCatalogFilters);
}

function applyCatalogFilters() {
  const search = document.getElementById("catalogSearchInput")?.value.toLowerCase().trim() || "";
  const dept = document.getElementById("catalogDeptSelect")?.value || "All";
  const course = document.getElementById("catalogCourseSelect")?.value || "All";

  const filtered = allProducts.filter((p) => {
    if (dept !== "All" && p.department !== "All" && p.department !== dept) return false;
    if (course !== "All" && p.course_strand !== "All" && p.course_strand !== course) return false;
    if (search.length > 0) {
      const matchName = (p.name || "").toLowerCase().includes(search);
      const matchCourse = (p.course_strand || "").toLowerCase().includes(search);
      const matchCat = (p.category || "").toLowerCase().includes(search);
      if (!matchName && !matchCourse && !matchCat) return false;
    }
    return true;
  });

  const countPill = document.getElementById("catalogCountPill");
  if (countPill) countPill.textContent = `Showing ${filtered.length} of ${allProducts.length} uniforms`;

  renderProductsGrid(filtered);
}

function renderProductsGrid(products) {
  const container = document.getElementById("productsGrid");
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `<div class="table-empty" style="grid-column: 1/-1;">No uniforms match your search or filter.</div>`;
    return;
  }

  container.innerHTML = products
    .map((p) => {
      const stock = parseInt(p.stock || 0);
      const isLow = stock <= 15;
      const stockClass = isLow ? "low-stock" : "in-stock";
      const stockLabel = stock <= 0 ? "Out of Stock" : `${stock} in stock`;

      const courseCode = p.course_strand || "All";
      const courseBadgeClass = courseCode.replace(/\s+/g, "");

      // Image or fallback icon
      const thumbContent = p.image_url
        ? `<img src="${p.image_url}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
           <svg class="fallback-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="display:none;"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/></svg>`
        : `<svg class="fallback-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/></svg>`;

      return `
      <div class="product-admin-card">
        <div class="product-card-thumb-wrap">
          ${thumbContent}
          <div class="prod-badge-dept">${escapeHtml(p.department || "College")}</div>
          ${courseCode !== "All" ? `<div class="prod-badge-course course-tag-badge ${courseBadgeClass}">${escapeHtml(courseCode)}</div>` : ""}
        </div>
        <div class="product-card-body">
          <div class="product-card-name">${escapeHtml(p.name)}</div>
          <div class="product-card-sizes">Sizes: ${escapeHtml(p.sizes || "XS, S, M, L, XL")}</div>
          <div class="product-card-meta-row">
            <span class="product-card-price">₱${formatMoney(p.price)}</span>
            <span class="product-card-stock ${stockClass}">${stockLabel}</span>
          </div>
          <div class="product-card-actions">
            <button class="btn-action-edit" onclick="openEditProductModal(${p.id})">✏️ Edit</button>
            <button class="btn-action-stock" onclick="openStockModal(${p.id}, '${escapeHtml(p.name)}', ${stock})">📦 Stock</button>
            <button class="btn-action-del" onclick="deleteProduct(${p.id}, '${escapeHtml(p.name)}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

/* ── IMAGE UPLOADER ── */
function setupImageUploader() {
  const btnSelectFile = document.getElementById("btnSelectFile");
  const fileInput = document.getElementById("imageFileInput");
  const urlInput = document.getElementById("prodImageUrl");
  const previewImg = document.getElementById("imagePreviewImg");
  const placeholderIcon = document.getElementById("imagePlaceholderIcon");

  btnSelectFile?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      if (previewImg) {
        previewImg.src = event.target.result;
        previewImg.style.display = "block";
      }
      if (placeholderIcon) placeholderIcon.style.display = "none";
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append("image", file);

    try {
      showToast("Uploading uniform photograph to server...");
      const res = await fetch(`${API_BASE}/upload_image.php`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        if (urlInput) urlInput.value = data.data.url;
        showToast("Photo uploaded successfully!");
      } else {
        alert("Upload failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Photo upload failed. Check connection.");
    }
  });

  urlInput?.addEventListener("input", (e) => {
    const url = e.target.value.trim();
    if (url.length > 5) {
      if (previewImg) {
        previewImg.src = url;
        previewImg.style.display = "block";
      }
      if (placeholderIcon) placeholderIcon.style.display = "none";
    } else {
      if (previewImg) previewImg.style.display = "none";
      if (placeholderIcon) placeholderIcon.style.display = "block";
    }
  });
}

/* ── MODAL: ADD / EDIT PRODUCT ── */
function setupProductModal() {
  const modal = document.getElementById("productModal");
  const btnOpen = document.getElementById("btnOpenAddModal");
  const btnClose = document.getElementById("btnProductModalClose");
  const btnCancel = document.getElementById("btnCancelProductModal");
  const form = document.getElementById("productForm");

  btnOpen?.addEventListener("click", () => {
    // Reset form for new product
    document.getElementById("prodFormId").value = "0";
    document.getElementById("productModalTitle").textContent = "Add New Uniform";
    document.getElementById("btnSaveProductText").textContent = "Save Uniform";
    form.reset();

    const previewImg = document.getElementById("imagePreviewImg");
    const placeholderIcon = document.getElementById("imagePlaceholderIcon");
    if (previewImg) previewImg.style.display = "none";
    if (placeholderIcon) placeholderIcon.style.display = "block";

    modal.classList.add("active");
  });

  const closeModal = () => modal?.classList.remove("active");
  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = parseInt(document.getElementById("prodFormId").value) || 0;
    const payload = {
      id,
      name: document.getElementById("prodName").value.trim(),
      department: document.getElementById("prodDept").value,
      course_strand: document.getElementById("prodCourse").value,
      category: document.getElementById("prodCategory").value,
      gender: document.getElementById("prodGender").value,
      price: parseFloat(document.getElementById("prodPrice").value) || 0,
      stock: parseInt(document.getElementById("prodStock").value) || 0,
      sizes: document.getElementById("prodSizes").value.trim(),
      description: document.getElementById("prodDescription").value.trim(),
      image_url: document.getElementById("prodImageUrl").value.trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/save_product.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(id > 0 ? "Uniform updated successfully!" : "New uniform added to catalog!");
        closeModal();
        loadCatalog();
        loadAnalytics();
      } else {
        alert("Failed to save: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Save uniform error:", err);
      alert("Error communicating with server.");
    }
  });
}

window.openEditProductModal = function (id) {
  const item = allProducts.find((p) => p.id == id);
  if (!item) return;

  const modal = document.getElementById("productModal");
  document.getElementById("prodFormId").value = item.id;
  document.getElementById("productModalTitle").textContent = "Edit Uniform SKU";
  document.getElementById("btnSaveProductText").textContent = "Update Uniform";

  document.getElementById("prodName").value = item.name || "";
  document.getElementById("prodDept").value = item.department || "College";
  document.getElementById("prodCourse").value = item.course_strand || "All";
  document.getElementById("prodCategory").value = item.category || "Tops";
  document.getElementById("prodGender").value = item.gender || "Unisex";
  document.getElementById("prodPrice").value = item.price || "";
  document.getElementById("prodStock").value = item.stock || "";
  document.getElementById("prodSizes").value = item.sizes || "";
  document.getElementById("prodDescription").value = item.description || "";
  document.getElementById("prodImageUrl").value = item.image_url || "";

  const previewImg = document.getElementById("imagePreviewImg");
  const placeholderIcon = document.getElementById("imagePlaceholderIcon");
  if (item.image_url) {
    if (previewImg) {
      previewImg.src = item.image_url;
      previewImg.style.display = "block";
    }
    if (placeholderIcon) placeholderIcon.style.display = "none";
  } else {
    if (previewImg) previewImg.style.display = "none";
    if (placeholderIcon) placeholderIcon.style.display = "block";
  }

  modal?.classList.add("active");
};

window.deleteProduct = async function (id, name) {
  if (!confirm(`Are you sure you want to archive or remove "${name}" from the catalog?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/delete_product.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, permanent: false }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Archived uniform: ${name}`);
      loadCatalog();
      loadAnalytics();
    } else {
      alert("Failed to delete: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Delete error:", err);
  }
};

/* ── MODAL: STOCK ADJUST ── */
function setupStockModal() {
  const modal = document.getElementById("stockModal");
  const btnClose = document.getElementById("btnStockModalClose");
  const btnCancel = document.getElementById("btnCancelStockModal");
  const form = document.getElementById("stockForm");
  const input = document.getElementById("stockAdjustAmount");

  const closeModal = () => modal?.classList.remove("active");
  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  document.querySelectorAll(".stock-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = parseInt(btn.getAttribute("data-step") || 0);
      const current = parseInt(input.value) || 0;
      input.value = current + step;
    });
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById("stockFormId").value);
    const amount = parseInt(input.value) || 0;

    try {
      const res = await fetch(`${API_BASE}/update_stock.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: id, quantity_change: amount }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Stock level updated successfully!");
        closeModal();
        loadCatalog();
        loadAnalytics();
      } else {
        alert("Failed to update stock: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Stock adjust error:", err);
    }
  });
}

window.openStockModal = function (id, name, currentStock) {
  const modal = document.getElementById("stockModal");
  document.getElementById("stockFormId").value = id;
  document.getElementById("stockModalSubtitle").textContent = `${name} (Current: ${currentStock} pcs)`;
  document.getElementById("stockAdjustAmount").value = 20;
  modal?.classList.add("active");
};

/* ── TAB 3: MASTER ORDERS & RELEASING ── */
async function loadOrders() {
  const tbody = document.getElementById("masterOrdersTableBody");
  try {
    const res = await fetch(`${API_BASE}/get_staff_orders.php`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return;

    allOrders = json.data;
    renderMasterOrders();

    document.getElementById("ordersStatusFilter")?.addEventListener("change", renderMasterOrders);
  } catch (err) {
    console.error("Failed to load orders:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Failed to load orders from API.</td></tr>`;
  }
}

function renderMasterOrders() {
  const tbody = document.getElementById("masterOrdersTableBody");
  if (!tbody) return;

  const filter = document.getElementById("ordersStatusFilter")?.value || "All";
  const filtered = allOrders.filter((o) => (filter === "All" ? true : o.status === filter));

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No orders found for status "${filter}".</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((o) => {
      const studentName = `${o.first_name || ""} ${o.last_name || ""}`.trim() || o.student_id;
      const itemsCount = (o.items || []).reduce((acc, it) => acc + parseInt(it.quantity || 1), 0);
      const itemsTooltip = (o.items || []).map((it) => `${it.product_name} (${it.size}) x${it.quantity}`).join(", ");

      return `
      <tr>
        <td><strong class="order-code-badge">${o.order_code || "#" + o.id}</strong></td>
        <td>
          <div style="font-weight:700;">${escapeHtml(studentName)}</div>
          <div style="font-size:11px; color:var(--slate-500);">${escapeHtml(o.student_id)}</div>
        </td>
        <td>
          <div>${escapeHtml(o.department || "College")}</div>
          <div style="font-size:11px; font-weight:700; color:var(--oc-green-700);">${escapeHtml(o.course_strand || "")}</div>
        </td>
        <td title="${escapeHtml(itemsTooltip)}">
          <span style="font-weight:600;">${itemsCount} item(s)</span>
        </td>
        <td><strong style="color:var(--oc-green-700);">₱${formatMoney(o.total_amount)}</strong></td>
        <td>
          <div>${escapeHtml(o.pickup_day || "N/A")}</div>
          <div style="font-size:11px; color:var(--slate-500);">${escapeHtml(o.time_slot || "")}</div>
        </td>
        <td><span class="status-badge ${o.status}">${o.status}</span></td>
        <td>
          <select onchange="updateMasterOrderStatus(${o.id}, this.value)" style="font-size:11px; padding:4px 6px; border-radius:4px;">
            <option value="Pending" ${o.status === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Ready" ${o.status === "Ready" ? "selected" : ""}>Ready</option>
            <option value="Completed" ${o.status === "Completed" ? "selected" : ""}>Completed</option>
          </select>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.updateMasterOrderStatus = async function (orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/update_order_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order status updated to ${newStatus}`);
      loadOrders();
      loadAnalytics();
    } else {
      alert("Failed to update status: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Update status error:", err);
  }
};

/* ── TAB 4 & 5: USERS (STUDENTS & STAFF) ── */
async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/get_users.php`);
    const json = await res.json();
    if (!json.success || !json.data) return;

    allStudents = json.data.students || [];
    allStaff = json.data.staff || [];

    renderStudentsTable();
    renderStaffTable();

    document.getElementById("studentSearchInput")?.addEventListener("input", renderStudentsTable);
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

function renderStudentsTable() {
  const tbody = document.getElementById("studentsTableBody");
  if (!tbody) return;

  const q = document.getElementById("studentSearchInput")?.value.toLowerCase().trim() || "";
  const filtered = allStudents.filter((s) => {
    if (!q) return true;
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    const sid = (s.student_id || "").toLowerCase();
    const course = (s.course_strand || "").toLowerCase();
    return name.includes(q) || sid.includes(q) || course.includes(q);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No students found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((s) => {
      const isVer = s.is_verified == 1;
      const verBadge = isVer
        ? `<span class="meta-tag green">Verified</span>`
        : `<span class="meta-tag orange">Unverified</span>`;
      return `
      <tr>
        <td><strong>${escapeHtml(s.student_id)}</strong></td>
        <td>${escapeHtml(s.first_name + " " + s.last_name)}</td>
        <td>${escapeHtml(s.email || "—")}</td>
        <td>${escapeHtml(s.department || "College")}</td>
        <td><span class="course-tag-badge ${s.course_strand || ""}">${escapeHtml(s.course_strand || "General")}</span></td>
        <td>${escapeHtml(s.year_level || "—")}</td>
        <td>${verBadge}</td>
        <td>${escapeHtml(s.created_at || "—")}</td>
      </tr>
    `;
    })
    .join("");
}

function setupStaffFilters() {
  document.getElementById("staffRoleFilter")?.addEventListener("change", renderStaffTable);
}

function renderStaffTable() {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  const roleFilter = document.getElementById("staffRoleFilter")?.value || "All";
  const filtered = allStaff.filter((st) => (roleFilter === "All" ? true : st.role === roleFilter));

  const countPill = document.getElementById("staffCountPill");
  if (countPill) countPill.textContent = `Showing ${filtered.length} of ${allStaff.length} accounts`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No accounts found for "${roleFilter}".</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((st) => {
      const isSuperAdmin = st.role === "Super Admin";
      const roleBadge = isSuperAdmin
        ? `<span class="badge-dept" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-weight:800;">👑 Super Admin</span>`
        : `<span class="badge-dept">${escapeHtml(st.role)}</span>`;

      const activeBadge = st.is_active == 1
        ? `<span class="meta-tag green">Active</span>`
        : `<span class="meta-tag red">Disabled</span>`;

      const isRoot = parseInt(st.id) <= 2;
      const actionHtml = isRoot
        ? `<span style="font-size:11px; color:var(--slate-400); font-weight:600;">System Protected</span>`
        : `
          <div style="display:flex; gap:6px;">
            <button class="btn-action-stock" style="padding:4px 8px; font-size:11px;" onclick="toggleStaffActive(${st.id}, ${st.is_active == 1 ? 0 : 1})">
              ${st.is_active == 1 ? "Disable" : "Enable"}
            </button>
            <button class="btn-action-del" style="padding:4px 8px; font-size:11px;" onclick="deleteStaffAccount(${st.id}, '${escapeHtml(st.username)}')">
              🗑️
            </button>
          </div>
        `;

      return `
      <tr>
        <td><strong style="color:var(--oc-green-700); font-family:monospace; font-size:13px;">${escapeHtml(st.username)}</strong></td>
        <td><strong>${escapeHtml(st.full_name)}</strong></td>
        <td>${escapeHtml(st.email || "—")}</td>
        <td>${roleBadge}</td>
        <td>${escapeHtml(st.station || "Counter 01")}</td>
        <td>${activeBadge}</td>
        <td style="font-size:11px; color:var(--slate-500);">${escapeHtml(st.created_at || "—")}</td>
        <td>${actionHtml}</td>
      </tr>
    `;
    })
    .join("");
}

/* ── MODAL: ADD ADMIN / STAFF ACCOUNT ── */
function setupStaffModal() {
  const modal = document.getElementById("staffModal");
  const btnOpenAdmin = document.getElementById("btnOpenAddAdminModal");
  const btnOpenStaff = document.getElementById("btnOpenAddStaffModal");
  const btnClose = document.getElementById("btnStaffModalClose");
  const btnCancel = document.getElementById("btnCancelStaffModal");
  const form = document.getElementById("staffForm");
  const roleSelect = document.getElementById("staffRole");
  const stationInput = document.getElementById("staffStation");
  const passwordInput = document.getElementById("staffPassword");
  const passwordHint = document.getElementById("staffPasswordHint");
  const roleHintBox = document.getElementById("roleHintBox");
  const modalTitle = document.getElementById("staffModalTitle");
  const modalSubtitle = document.getElementById("staffModalSubtitle");
  const submitText = document.getElementById("btnStaffSubmitText");

  const updateRoleUI = (role) => {
    if (role === "Super Admin") {
      stationInput.value = "Main Admin Office";
      passwordInput.value = "Admin2026!";
      if (passwordHint) passwordHint.textContent = "Default for Admin: Admin2026! (Bcrypt encrypted)";
      if (roleHintBox) {
        roleHintBox.style.background = "#fef3c7";
        roleHintBox.style.borderColor = "#fde68a";
        roleHintBox.style.color = "#92400e";
        roleHintBox.innerHTML = `👑 <strong>Super Admin</strong>: May full access sa sales revenue, add/edit/delete ng uniforms at mga kurso, photo uploads, at pamamahala ng mga accounts.`;
      }
    } else if (role === "Cashier") {
      stationInput.value = "Counter 01";
      passwordInput.value = "Staff2026!";
      if (passwordHint) passwordHint.textContent = "Default for Cashier: Staff2026! (Bcrypt encrypted)";
      if (roleHintBox) {
        roleHintBox.style.background = "#eff6ff";
        roleHintBox.style.borderColor = "#bfdbfe";
        roleHintBox.style.color = "#1e40af";
        roleHintBox.innerHTML = `💳 <strong>Cashier</strong>: May access sa Counter POS screen, pagkuha ng bayad, at automated change calculator.`;
      }
    } else {
      stationInput.value = "Counter 01";
      passwordInput.value = "Staff2026!";
      if (passwordHint) passwordHint.textContent = "Default for Staff: Staff2026! (Bcrypt encrypted)";
      if (roleHintBox) {
        roleHintBox.style.background = "#f0fdf4";
        roleHintBox.style.borderColor = "#bbf7d0";
        roleHintBox.style.color = "#14532d";
        roleHintBox.innerHTML = `🏪 <strong>Store Staff</strong>: May access sa Counter Releasing Portal at Mobile Scanner app para mag-scan ng QR code at mag-release ng uniforms.`;
      }
    }
  };

  roleSelect?.addEventListener("change", (e) => {
    updateRoleUI(e.target.value);
  });

  // Open for Super Admin
  btnOpenAdmin?.addEventListener("click", () => {
    form?.reset();
    if (modalTitle) modalTitle.textContent = "Add Administrator Account";
    if (modalSubtitle) modalSubtitle.textContent = "Create an account with full Super Admin privileges";
    if (submitText) submitText.textContent = "Create Administrator";
    if (roleSelect) roleSelect.value = "Super Admin";
    updateRoleUI("Super Admin");
    modal?.classList.add("active");
  });

  // Open for Store Staff
  btnOpenStaff?.addEventListener("click", () => {
    form?.reset();
    if (modalTitle) modalTitle.textContent = "Add Store Personnel Account";
    if (modalSubtitle) modalSubtitle.textContent = "Create login credentials for store counter & releasing";
    if (submitText) submitText.textContent = "Create Staff Account";
    if (roleSelect) roleSelect.value = "Store Staff";
    updateRoleUI("Store Staff");
    modal?.classList.add("active");
  });

  const closeModal = () => modal?.classList.remove("active");
  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const role = document.getElementById("staffRole").value;
    const payload = {
      action: role === "Super Admin" ? "create_admin" : "create_staff",
      username: document.getElementById("staffUsername").value.trim(),
      full_name: document.getElementById("staffFullName").value.trim(),
      email: document.getElementById("staffEmail").value.trim(),
      role: role,
      station: document.getElementById("staffStation").value.trim(),
      password: document.getElementById("staffPassword").value,
    };

    try {
      const res = await fetch(`${API_BASE}/get_users.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${role} account created successfully! Username: ${payload.username}`);
        closeModal();
        loadUsers();
        loadAnalytics();
      } else {
        alert("Failed to create account: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Create account error:", err);
      alert("Error communicating with server.");
    }
  });
}

window.toggleStaffActive = async function (id, newActive) {
  try {
    const res = await fetch(`${API_BASE}/get_users.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_active", id, is_active: newActive }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(newActive == 1 ? "Account activated." : "Account deactivated.");
      loadUsers();
    } else {
      alert("Failed to update status: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Toggle error:", err);
  }
};

window.deleteStaffAccount = async function (id, username) {
  if (!confirm(`Are you sure you want to permanently delete account "${username}"?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/get_users.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_staff", id }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Account "${username}" removed.`);
      loadUsers();
      loadAnalytics();
    } else {
      alert("Failed to delete account: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Delete staff error:", err);
  }
};

/* ── MODAL: SWITCH / LOGIN ACCOUNT ── */
function setupLoginModal() {
  const modal = document.getElementById("loginModal");
  const userPill = document.getElementById("adminUserPill");
  const btnSwitch = document.getElementById("btnSwitchAccount");
  const btnClose = document.getElementById("btnLoginModalClose");
  const btnCancel = document.getElementById("btnCancelLoginModal");
  const form = document.getElementById("adminLoginForm");

  // Load saved session or set default
  const saved = localStorage.getItem("oc_current_admin");
  if (saved) {
    try {
      const user = JSON.parse(saved);
      updateCurrentAdminUI(user);
    } catch {}
  }

  const openModal = () => {
    form?.reset();
    modal?.classList.add("active");
  };

  const closeModal = () => modal?.classList.remove("active");

  userPill?.addEventListener("click", openModal);
  btnSwitch?.addEventListener("click", openModal);
  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const identifier = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const res = await fetch(`${API_BASE}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        const user = data.data.user;
        localStorage.setItem("oc_current_admin", JSON.stringify(user));
        updateCurrentAdminUI(user);
        showToast(`Welcome, ${user.name || user.username}! Logged in as ${user.role || "Staff"}.`);
        closeModal();
      } else {
        alert("Login failed: " + (data.message || "Invalid credentials"));
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Error connecting to login API.");
    }
  });
}

function updateCurrentAdminUI(user) {
  const nameEl = document.getElementById("currentAdminName");
  const roleEl = document.getElementById("currentAdminRole");
  const avatarEl = document.getElementById("currentAdminAvatar");

  if (nameEl) nameEl.textContent = user.name || user.full_name || user.username || "Administrator";
  if (roleEl) roleEl.textContent = user.role || "Super Admin";
  if (avatarEl) {
    const rawName = user.name || user.full_name || user.username || "AD";
    const parts = rawName.split(" ").filter(Boolean);
    const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : rawName.substring(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
