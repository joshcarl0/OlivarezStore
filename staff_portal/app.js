// app.js - Store Staff & Cashier Portal Logic
const API_BASE = window.location.origin + "/olivarez_api";

// State
let allOrders = [];
let activeOrder = null;
let currentFilter = "All";
let allInventory = [];
let currentDept = "All";
let html5QrCode = null;
let isCameraActive = false;

// ─── INIT ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  startClock();
  loadStaffOrders();
  loadInventory();

  // Polling for live orders every 10 seconds
  setInterval(loadStaffOrders, 10000);
});

// ─── CLOCK ─────────────────────────────────────────────────
function startClock() {
  const clockEl = document.getElementById("live-clock");
  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString("en-US", { hour12: true });
  }
  tick();
  setInterval(tick, 1000);
}

// ─── TAB SWITCHING ─────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));

  document.getElementById(`tab-${tabId}`).classList.add("active");
  document.getElementById(`view-${tabId}`).classList.add("active");

  if (tabId === "orders") {
    renderOrdersTable();
  } else if (tabId === "inventory") {
    renderInventory();
  }
}

// ─── LOAD ORDERS FROM API ──────────────────────────────────
async function loadStaffOrders() {
  try {
    const res = await fetch(`${API_BASE}/get_staff_orders.php`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allOrders = data.data;
      updateStatsAndBadges();
      renderPresetButtons();
      renderOrdersTable();

      // If active order was loaded, refresh its status in view
      if (activeOrder) {
        const found = allOrders.find(o => o.id === activeOrder.id);
        if (found) {
          activeOrder = found;
          displayOrderDetail(activeOrder);
        }
      }
    }
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

// ─── UPDATE COUNTERS & STATS ──────────────────────────────
function updateStatsAndBadges() {
  const pending = allOrders.filter(o => o.status === "Pending").length;
  const ready   = allOrders.filter(o => o.status === "Ready").length;
  const claimed = allOrders.filter(o => o.status === "Completed").length;

  document.getElementById("orders-badge").textContent = pending + ready;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-ready").textContent   = ready;
  document.getElementById("stat-claimed").textContent = claimed;

  document.getElementById("cnt-all").textContent       = allOrders.length;
  document.getElementById("cnt-pending").textContent   = pending;
  document.getElementById("cnt-ready").textContent     = ready;
  document.getElementById("cnt-completed").textContent = claimed;
}

// ─── RENDER QUICK PRESET BUTTONS (FOR FAST DEMO) ────────────
function renderPresetButtons() {
  const container = document.getElementById("quick-preset-buttons");
  if (!container) return;

  if (allOrders.length === 0) {
    container.innerHTML = `<span style="font-size: 12px; color: #999;">No orders yet</span>`;
    return;
  }

  container.innerHTML = allOrders.slice(0, 5).map(o => `
    <button class="btn-preset" onclick="selectOrderById(${o.id})">
      ⚡ ${o.order_code} (${o.first_name || 'Student'})
    </button>
  `).join("");
}

// ─── LOOKUP ORDER ──────────────────────────────────────────
function handleManualLookup(e) {
  e.preventDefault();
  const query = document.getElementById("lookup-input").value.trim();
  if (!query) return;

  findAndSelectOrder(query);
}

function findAndSelectOrder(term) {
  const cleanTerm = term.toLowerCase().replace(/[^a-z0-9-]/g, "");
  
  // Try exact match on order_code or student_id
  const match = allOrders.find(o => 
    (o.order_code && o.order_code.toLowerCase() === cleanTerm) ||
    (o.student_id && o.student_id.toLowerCase() === cleanTerm) ||
    (o.order_code && o.order_code.toLowerCase().includes(cleanTerm)) ||
    (o.student_id && o.student_id.toLowerCase().includes(cleanTerm)) ||
    (`${o.first_name} ${o.last_name}`.toLowerCase().includes(term.toLowerCase()))
  );

  if (match) {
    playBeepSound();
    selectOrderById(match.id);
  } else {
    alert(`Order or Student "${term}" not found. Please check the code and try again.`);
  }
}

function selectOrderById(orderId) {
  const found = allOrders.find(o => o.id === orderId);
  if (!found) return;

  activeOrder = found;
  switchTab("scan");
  displayOrderDetail(activeOrder);
}

// ─── DISPLAY ACTIVE ORDER DETAIL ───────────────────────────
function displayOrderDetail(order) {
  document.getElementById("empty-state").style.display = "none";
  document.getElementById("active-order-content").style.display = "block";

  // Code & Date
  document.getElementById("detail-order-code").textContent = order.order_code || `OL-${order.id}`;
  const dateObj = new Date(order.created_at || Date.now());
  document.getElementById("detail-order-date").textContent = "Placed on " + dateObj.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  // Status Pill
  const statusPill = document.getElementById("detail-status-badge");
  statusPill.textContent = order.status;
  statusPill.className = `status-pill ${order.status.toLowerCase()}`;

  // Student Info
  const fName = order.first_name || "Student";
  const lName = order.last_name || "";
  const initials = (fName[0] || "S") + (lName[0] || "");
  document.getElementById("detail-student-initials").textContent = initials.toUpperCase();
  document.getElementById("detail-student-name").textContent = `${fName} ${lName}`.trim();
  document.getElementById("detail-student-dept").textContent = `${order.department || 'College'} • ${order.course_strand || 'Enrolled Student'}`;
  document.getElementById("detail-student-id").textContent = `ID: ${order.student_id || 'N/A'}`;
  document.getElementById("detail-student-mobile").textContent = `📱 ${order.mobile || 'No Mobile'}`;

  // Pickup Card
  document.getElementById("detail-pickup-day").textContent = order.pickup_day || "Scheduled Day";
  document.getElementById("detail-time-slot").textContent = order.time_slot || "Regular Store Hours";
  document.getElementById("detail-payment-mode").textContent = order.payment_method || "Cash at Counter";

  // Uniform Items Checklist
  const itemsContainer = document.getElementById("detail-items-list");
  const items = order.items || [];
  document.getElementById("detail-items-count").textContent = items.length;

  if (items.length === 0) {
    itemsContainer.innerHTML = `<div class="item-sub">No items recorded in order.</div>`;
  } else {
    itemsContainer.innerHTML = items.map((item, idx) => `
      <label class="item-check-card ${order.status === 'Completed' ? 'checked' : ''}" id="item-card-${idx}">
        <div class="item-check-left">
          <input type="checkbox" class="item-checkbox" id="chk-item-${idx}" 
                 ${order.status === 'Completed' ? 'checked' : ''}
                 onchange="toggleItemCheck(${idx})">
          <div>
            <div class="item-title">${item.product_name || 'Olivarez Uniform Item'}</div>
            <div class="item-sub">Size: <strong>${item.size || 'M'}</strong> • Qty: <strong>${item.quantity} pc${item.quantity > 1 ? 's' : ''}</strong> • ${item.department || ''} (${item.gender || 'Standard'})</div>
          </div>
        </div>
        <div class="item-price">₱${(parseFloat(item.unit_price) * parseInt(item.quantity)).toFixed(2)}</div>
      </label>
    `).join("");
  }

  // Cashier Calculator
  const total = parseFloat(order.total_amount) || 0;
  document.getElementById("detail-total-amount").textContent = `₱${total.toFixed(2)}`;
  document.getElementById("cash-received").value = "";
  document.getElementById("calc-change").textContent = "₱0.00";

  // Button States
  const btnReady = document.getElementById("btn-mark-ready");
  const btnClaimed = document.getElementById("btn-mark-claimed");

  if (order.status === "Completed") {
    btnReady.style.display = "none";
    btnClaimed.textContent = "✅ Order Already Claimed";
    btnClaimed.disabled = true;
    btnClaimed.style.opacity = "0.7";
  } else if (order.status === "Ready") {
    btnReady.style.display = "none";
    btnClaimed.textContent = "✅ Complete & Release Uniform";
    btnClaimed.disabled = false;
    btnClaimed.style.opacity = "1";
  } else {
    btnReady.style.display = "inline-block";
    btnClaimed.textContent = "✅ Complete & Release Uniform";
    btnClaimed.disabled = false;
    btnClaimed.style.opacity = "1";
  }
}

function toggleItemCheck(idx) {
  const card = document.getElementById(`item-card-${idx}`);
  const chk = document.getElementById(`chk-item-${idx}`);
  if (chk.checked) {
    card.classList.add("checked");
  } else {
    card.classList.remove("checked");
  }
}

function calculateChange() {
  if (!activeOrder) return;
  const total = parseFloat(activeOrder.total_amount) || 0;
  const cashVal = parseFloat(document.getElementById("cash-received").value) || 0;
  const change = Math.max(0, cashVal - total);
  document.getElementById("calc-change").textContent = `₱${change.toFixed(2)}`;
}

// ─── STATUS UPDATES ────────────────────────────────────────
async function markActiveOrderReady() {
  if (!activeOrder) return;
  await updateOrderStatus(activeOrder.id, "Ready");
}

async function markActiveOrderClaimed() {
  if (!activeOrder) return;

  const total = parseFloat(activeOrder.total_amount) || 0;
  const cashVal = parseFloat(document.getElementById("cash-received").value) || 0;
  
  if (cashVal > 0 && cashVal < total) {
    if (!confirm(`Warning: Cash entered (₱${cashVal.toFixed(2)}) is less than total due (₱${total.toFixed(2)}). Continue anyway?`)) {
      return;
    }
  }

  await updateOrderStatus(activeOrder.id, "Completed");
  playSuccessSound();
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/update_order_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, status: newStatus })
    });
    const result = await res.json();
    if (result.success) {
      await loadStaffOrders();
    } else {
      alert("Error: " + (result.message || "Failed to update status"));
    }
  } catch (err) {
    alert("Server connection failed. Make sure Apache/XAMPP is running.");
  }
}

// ─── TAB 2: ORDERS QUEUE TABLE ─────────────────────────────
function setOrdersFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  event.target.classList.add("active");
  renderOrdersTable();
}

function filterOrdersTable() {
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById("orders-tbody");
  if (!tbody) return;

  const search = (document.getElementById("queue-search")?.value || "").toLowerCase().trim();

  let list = allOrders;
  if (currentFilter !== "All") {
    list = list.filter(o => o.status === currentFilter);
  }

  if (search) {
    list = list.filter(o => 
      (o.order_code && o.order_code.toLowerCase().includes(search)) ||
      (o.student_id && o.student_id.toLowerCase().includes(search)) ||
      (`${o.first_name} ${o.last_name}`.toLowerCase().includes(search)) ||
      (o.department && o.department.toLowerCase().includes(search))
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #999; padding: 30px;">No orders found matching the filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(o => {
    const itemsCount = (o.items || []).reduce((acc, i) => acc + parseInt(i.quantity || 1), 0);
    return `
      <tr>
        <td><strong style="color: #1a5c2e; font-family: Outfit, sans-serif; font-size: 14px;">${o.order_code || 'OL-'+o.id}</strong></td>
        <td>
          <div style="font-weight: 700;">${o.first_name || 'Student'} ${o.last_name || ''}</div>
          <div style="font-size: 11px; color: #777;">ID: ${o.student_id}</div>
        </td>
        <td>
          <div>${o.department || 'College'}</div>
          <div style="font-size: 11px; color: #777;">${o.course_strand || ''}</div>
        </td>
        <td>${itemsCount} item${itemsCount > 1 ? 's' : ''}</td>
        <td><strong style="color: #1a5c2e;">₱${parseFloat(o.total_amount).toFixed(2)}</strong></td>
        <td>
          <div>${o.pickup_day || 'N/A'}</div>
          <div style="font-size: 11px; color: #777;">${o.time_slot || ''}</div>
        </td>
        <td><span class="status-pill ${o.status.toLowerCase()}">${o.status}</span></td>
        <td style="text-align: right;">
          <button class="btn-inspect" onclick="selectOrderById(${o.id})">Inspect & Release</button>
        </td>
      </tr>
    `;
  }).join("");
}

// ─── TAB 3: INVENTORY ──────────────────────────────────────
async function loadInventory() {
  try {
    const res = await fetch(`${API_BASE}/get_inventory.php`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allInventory = data.data;
      renderInventory();
    }
  } catch (err) {
    console.error("Error loading inventory:", err);
  }
}

function setInventoryDept(dept) {
  currentDept = dept;
  document.querySelectorAll(".dept-pill").forEach(p => p.classList.remove("active"));
  event.target.classList.add("active");
  renderInventory();
}

function filterInventory() {
  renderInventory();
}

function renderInventory() {
  const container = document.getElementById("inventory-grid");
  if (!container) return;

  const search = (document.getElementById("inv-search")?.value || "").toLowerCase().trim();

  let list = allInventory;
  if (currentDept !== "All") {
    list = list.filter(p => p.department === currentDept);
  }

  if (search) {
    list = list.filter(p => p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search));
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">No uniforms found in this department.</div>`;
    return;
  }

  container.innerHTML = list.map(p => {
    const stock = parseInt(p.stock) || 0;
    const isLow = stock < 15;
    return `
      <div class="inv-card">
        <div class="inv-badge-row">
          <span class="inv-dept">${p.department || 'Olivarez'}</span>
          <span class="inv-gender">${p.gender || 'Standard'}</span>
        </div>
        <div class="inv-name">${p.name}</div>
        <div class="inv-price">₱${parseFloat(p.price).toFixed(2)}</div>
        
        <div class="inv-stock-row">
          <div>
            <span style="font-size: 11px; color: #888; display: block;">In Stock:</span>
            <span class="stock-pill ${isLow ? 'low' : 'good'}">${stock} pcs ${isLow ? '⚠️' : ''}</span>
          </div>
          <div class="quick-adj">
            <button class="btn-adj" onclick="adjustStock(${p.id}, 'add', 5)">+5</button>
            <button class="btn-adj" onclick="adjustStock(${p.id}, 'add', 10)">+10</button>
            <button class="btn-adj" onclick="adjustStock(${p.id}, 'subtract', 1)">-1</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function adjustStock(productId, action, amount) {
  try {
    const res = await fetch(`${API_BASE}/update_stock.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, action, amount })
    });
    const result = await res.json();
    if (result.success) {
      await loadInventory();
    }
  } catch (err) {
    alert("Failed to update stock");
  }
}

// ─── RECEIPT MODAL ─────────────────────────────────────────
function printReceipt() {
  if (!activeOrder) return;

  const total = parseFloat(activeOrder.total_amount) || 0;
  const cashVal = parseFloat(document.getElementById("cash-received").value) || total;
  const change = Math.max(0, cashVal - total);

  document.getElementById("rec-order-code").textContent = activeOrder.order_code || `OL-${activeOrder.id}`;
  document.getElementById("rec-date").textContent = new Date().toLocaleDateString("en-US");
  document.getElementById("rec-student-id").textContent = activeOrder.student_id;
  document.getElementById("rec-name").textContent = `${activeOrder.first_name || ''} ${activeOrder.last_name || ''}`.trim();
  document.getElementById("rec-course").textContent = `${activeOrder.department || ''} - ${activeOrder.course_strand || ''}`;

  const tbody = document.getElementById("rec-items-tbody");
  tbody.innerHTML = (activeOrder.items || []).map(i => `
    <tr>
      <td>${i.product_name} (${i.size})</td>
      <td style="text-align: center;">${i.quantity}</td>
      <td style="text-align: right;">₱${(parseFloat(i.unit_price) * parseInt(i.quantity)).toFixed(2)}</td>
    </tr>
  `).join("");

  document.getElementById("rec-total").textContent = `₱${total.toFixed(2)}`;
  document.getElementById("rec-cash").textContent = `₱${cashVal.toFixed(2)}`;
  document.getElementById("rec-change").textContent = `₱${change.toFixed(2)}`;

  document.getElementById("receipt-modal").style.display = "flex";
}

function closeReceiptModal() {
  document.getElementById("receipt-modal").style.display = "none";
}

// ─── CAMERA QR SCANNER ─────────────────────────────────────
function toggleCameraScanner() {
  const container = document.getElementById("qr-reader-container");
  const camText = document.getElementById("cam-text");

  if (isCameraActive) {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        container.style.display = "none";
        camText.textContent = "Open Camera";
        isCameraActive = false;
      }).catch(err => console.error(err));
    }
  } else {
    container.style.display = "block";
    camText.textContent = "Close Camera";
    isCameraActive = true;

    html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Successful QR scan
        console.log("QR Code scanned:", decodedText);
        findAndSelectOrder(decodedText);
        toggleCameraScanner(); // close camera after successful scan
      },
      (errorMessage) => {
        // Continuous scan parsing, no action needed
      }
    ).catch(err => {
      alert("Camera access error or no webcam found. You can use the search bar or quick demo presets.");
      container.style.display = "none";
      camText.textContent = "Open Camera";
      isCameraActive = false;
    });
  }
}

// ─── AUDIO CHIMES ──────────────────────────────────────────
function playBeepSound() {
  const snd = document.getElementById("snd-beep");
  if (snd) { snd.currentTime = 0; snd.play().catch(() => {}); }
}

function playSuccessSound() {
  const snd = document.getElementById("snd-success");
  if (snd) { snd.currentTime = 0; snd.play().catch(() => {}); }
}
