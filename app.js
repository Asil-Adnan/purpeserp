// Purpes ERP Controller App

class PurpesApp {
  constructor() {
    this.currentRole = 'sales'; // Default role
    this.currentView = 'dashboard'; // Default view
    this.itemRowCount = 0;
    
    // Bind event listeners and initializers
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  init() {
    // Start macOS Digital Clock
    this.startClock();
    
    const user = window.PurpesDB.getCurrentUser();
    if (user) {
      document.getElementById('login-screen').style.display = 'none';
      this.switchRole(user.role, user);
    } else {
      document.getElementById('login-screen').style.display = 'flex';
    }
    
    // Setup search listeners
    document.getElementById('order-search').addEventListener('input', () => this.filterOrders());
    document.getElementById('filter-status').addEventListener('change', () => this.filterOrders());
    document.getElementById('filter-payment').addEventListener('change', () => this.filterOrders());
    
    // Initialize Neumorphic Selects
    this.initNeuSelects();
    
    // Close custom dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.neu-select-container')) {
        document.querySelectorAll('.neu-select-container.open').forEach(el => {
          el.classList.remove('open');
        });
      }
    });
  }

  // macOS Top Bar Clock
  startClock() {
    const clockEl = document.getElementById('mac-clock');
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      clockEl.innerText = `${hours}:${minutes} ${ampm}`;
    };
    updateTime();
    setInterval(updateTime, 60000);
  }

  // Custom Neumorphic Dropdowns
  initNeuSelects(containerNode = document) {
    const selects = containerNode.querySelectorAll('select.input-neu');
    selects.forEach(select => {
      if (select.dataset.neuInitialized) return;
      select.dataset.neuInitialized = "true";
      select.style.display = 'none'; // Hide native select

      const container = document.createElement('div');
      container.className = 'neu-select-container';
      
      const trigger = document.createElement('div');
      trigger.className = 'neu-select-trigger';
      
      // Initial trigger text
      const selectedOption = select.options[select.selectedIndex];
      trigger.innerText = selectedOption ? selectedOption.text : 'Select...';
      
      const dropdown = document.createElement('div');
      dropdown.className = 'neu-select-dropdown';
      
      // Build options
      Array.from(select.options).forEach((opt, idx) => {
        if (!opt.value && opt.text.startsWith('Select')) return; // Skip placeholders if needed
        const optionDiv = document.createElement('div');
        optionDiv.className = 'neu-select-option';
        optionDiv.innerText = opt.text;
        if (select.selectedIndex === idx) {
          optionDiv.classList.add('selected');
        }
        
        optionDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          trigger.innerText = opt.text;
          select.selectedIndex = idx;
          
          // Update selected classes
          dropdown.querySelectorAll('.neu-select-option').forEach(el => el.classList.remove('selected'));
          optionDiv.classList.add('selected');
          
          container.classList.remove('open');
          
          // Dispatch change event to original select
          const event = new Event('change', { bubbles: true });
          select.dispatchEvent(event);
        });
        
        dropdown.appendChild(optionDiv);
      });
      
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = container.classList.contains('open');
        document.querySelectorAll('.neu-select-container.open').forEach(el => el.classList.remove('open'));
        if (!isOpen) {
          container.classList.add('open');
        }
      });
      
      container.appendChild(trigger);
      container.appendChild(dropdown);
      select.parentNode.insertBefore(container, select.nextSibling);
    });
  }

  syncNeuSelects() {
    const selects = document.querySelectorAll('select.input-neu');
    selects.forEach(select => {
      if (!select.dataset.neuInitialized) return;
      
      const container = select.nextElementSibling;
      if (container && container.classList.contains('neu-select-container')) {
        const trigger = container.querySelector('.neu-select-trigger');
        const selectedOption = select.options[select.selectedIndex];
        if (trigger && selectedOption) {
          trigger.innerText = selectedOption.text;
        }
        
        const options = container.querySelectorAll('.neu-select-option');
        options.forEach((opt, idx) => {
          if (idx === select.selectedIndex) {
            opt.classList.add('selected');
          } else {
            opt.classList.remove('selected');
          }
        });
      }
    });
  }

  handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value.trim();

    const user = window.PurpesDB.login(usernameInput, passwordInput);
    if (user) {
      document.getElementById('login-screen').style.display = 'none';
      this.switchRole(user.role, user);
    } else {
      alert('Invalid username or password.');
    }
  }

  logout() {
    window.PurpesDB.logout();
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
  }

  // Switch Active User Role
  switchRole(role, user) {
    this.currentRole = role;
    this.currentUser = user;

    // Update User Profile Display
    document.getElementById('user-profile-display').style.display = 'flex';
    document.getElementById('active-user-name').innerText = user.name;

    // Update Dashboard session panel description
    const sessionRoleText = document.getElementById('session-role-text');
    const sessionPermissionsList = document.getElementById('session-permissions-list');
    
    if (role === 'sales') {
      sessionRoleText.innerText = 'Sales Representative';
      sessionPermissionsList.innerHTML = `
        <li>Create new mattress orders manually</li>
        <li>Download standard Excel template</li>
        <li>Upload orders via CSV spreadsheet</li>
        <li>Track status of submitted orders</li>
      `;
      // Allow adding order nav
      document.getElementById('nav-new-order').style.display = 'flex';
      document.getElementById('nav-accounts').style.display = 'none';
      document.getElementById('nav-users').style.display = 'none';
      if (this.currentView === 'accounts' || this.currentView === 'users') {
        this.switchView('dashboard');
      }
    } else if (role === 'shed_manager') {
      sessionRoleText.innerText = `Shed Manager (${user.shedId})`;
      sessionPermissionsList.innerHTML = `
        <li>Review all sales orders for Shed ${user.shedId}</li>
        <li>Approve or Reject submitted mattress orders</li>
        <li>Preview and generate formal PDF quotations</li>
        <li>Send quotation details directly to WhatsApp</li>
      `;
      document.getElementById('nav-new-order').style.display = 'none';
      document.getElementById('nav-accounts').style.display = 'none';
      document.getElementById('nav-users').style.display = 'none';
      if (this.currentView === 'new-order' || this.currentView === 'accounts' || this.currentView === 'users') {
        this.switchView('dashboard');
      }
    } else if (role === 'cashier') {
      sessionRoleText.innerText = 'Finance Head (Cashier)';
      sessionPermissionsList.innerHTML = `
        <li>Log offline payment receipts (UPI, Cash, Checks, Bank Transfers)</li>
        <li>Track unpaid/partially paid balances on approved orders</li>
        <li>Record mattress returns and payment refunds</li>
        <li>Generate and print Tax Invoices for cleared amounts</li>
      `;
      document.getElementById('nav-new-order').style.display = 'none';
      document.getElementById('nav-accounts').style.display = 'flex';
      document.getElementById('nav-users').style.display = 'none';
      if (this.currentView === 'new-order' || this.currentView === 'users') {
        this.switchView('dashboard');
      }
    } else if (role === 'super_admin') {
      sessionRoleText.innerText = 'Super Admin';
      sessionPermissionsList.innerHTML = `
        <li>Full access to all system features</li>
        <li>View and manage orders for all sheds</li>
        <li>Access accounts ledger and generate invoices</li>
      `;
      document.getElementById('nav-new-order').style.display = 'flex';
      document.getElementById('nav-accounts').style.display = 'flex';
      document.getElementById('nav-users').style.display = 'flex';
    }

    // Refresh active view table content
    this.refreshDashboard();
    this.renderOrdersList();
    this.renderAccountsLedger();
    if (role === 'super_admin') {
      this.renderUsersList();
    }
  }

  // Switch Main View Page
  switchView(viewName) {
    this.currentView = viewName;

    // Sidebar class toggles
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Content view panel toggle
    document.querySelectorAll('.view-panel').forEach(panel => {
      if (panel.id === `view-panel` || panel.id === `view-${viewName}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Render contents on switch
    if (viewName === 'dashboard') {
      this.refreshDashboard();
    } else if (viewName === 'new-order') {
      this.resetOrderForm();
    } else if (viewName === 'orders') {
      this.renderOrdersList();
    } else if (viewName === 'accounts') {
      this.renderAccountsLedger();
    }
  }

  // Reset or Seed Local Storage demo data
  resetDemoData() {
    if (confirm('Are you sure you want to reset all order and ledger records to demo defaults?')) {
      localStorage.clear();
      window.PurpesDB.init();
      this.refreshDashboard();
      this.renderOrdersList();
      this.renderAccountsLedger();
      alert('Database reset successfully.');
    }
  }

  // Helper to filter orders based on current user role
  getFilteredOrders() {
    const orders = window.PurpesDB.getOrders();
    if (this.currentRole === 'super_admin' || this.currentRole === 'cashier') {
      return orders;
    } else if (this.currentRole === 'shed_manager') {
      return orders.filter(o => o.shed === this.currentUser.shedId);
    } else if (this.currentRole === 'sales') {
      return orders.filter(o => o.salesPersonId === this.currentUser.username);
    }
    return orders;
  }

  // Refresh Dashboard Metrics & Analytics
  refreshDashboard() {
    const orders = this.getFilteredOrders();
    
    // Total Orders Value (Approved or Processing or Delivered)
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    const totalSales = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    document.getElementById('dash-total-sales').innerText = `₹${totalSales.toLocaleString('en-IN')}`;

    // Pending approvals count
    const pendingApprovals = orders.filter(o => o.status === 'Submitted').length;
    document.getElementById('dash-pending-approvals').innerText = pendingApprovals;

    // Payments received (Cleared Funds)
    let totalReceived = 0;
    let totalRefunded = 0;
    orders.forEach(o => {
      totalReceived += o.payments.reduce((s, p) => s + p.amount, 0);
      totalRefunded += o.returnsRefunds.reduce((s, r) => s + r.amount, 0);
    });
    
    document.getElementById('dash-total-received').innerText = `₹${(totalReceived - totalRefunded).toLocaleString('en-IN')}`;

    // Outstanding balance
    const outstanding = validOrders.reduce((sum, o) => sum + o.balanceAmount, 0);
    document.getElementById('dash-outstanding-balance').innerText = `₹${outstanding.toLocaleString('en-IN')}`;

    // Badge counts
    document.getElementById('orders-count-badge').innerText = `Active Orders: ${orders.length}`;

    // Render Recent Orders on Dashboard (Max 5)
    const recentOrders = orders.slice(0, 5);
    const tbody = document.getElementById('dashboard-orders-tbody');
    tbody.innerHTML = '';
    
    if (recentOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No orders logged yet.</td></tr>';
      return;
    }

    recentOrders.forEach(o => {
      const itemsCount = o.items.reduce((s, i) => s + i.quantity, 0);
      const formattedDate = new Date(o.orderDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      
      let actionButtons = '';
      if ((this.currentRole === 'shed_manager' || this.currentRole === 'super_admin') && o.status === 'Submitted') {
        actionButtons = `
          <button class="btn-neu sm success" onclick="app.approveOrder('${o.id}')">Approve</button>
        `;
      } else {
        actionButtons = `
          <button class="btn-neu sm primary" onclick="app.viewOrderSlip('${o.id}')">Order Slip</button>
          <button class="btn-neu sm" onclick="app.viewQuotation('${o.id}')">Quotation</button>
        `;
      }

      tbody.innerHTML += `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.customerName}<br><span style="font-size: 10px; color: var(--text-secondary);">${o.customerPhone}</span></td>
          <td>${formattedDate}</td>
          <td>${o.items[0]?.modelName || 'Unknown Model'} <br><span style="font-size: 10px; color: var(--text-secondary);">Qty: ${o.items[0]?.quantity || 1}</span></td>
          <td>₹${o.totalAmount.toLocaleString('en-IN')}</td>
          <td><span class="badge-status ${o.status.toLowerCase()}">${o.status}</span></td>
          <td>${actionButtons}</td>
        </tr>
      `;
    });
  }

  // --- Dynamic Order Form Management ---

  resetOrderForm() {
    document.getElementById('order-entry-form').reset();
    const container = document.getElementById('form-mattress-items-container');
    container.innerHTML = '';
    this.itemRowCount = 0;
    
    // Add first empty item
    this.addMattressItemFormRow();
    this.recalculateFormTotal();
    
    // Sync non-dynamic selects (like Production Shed) after form reset
    setTimeout(() => this.syncNeuSelects(), 0);
  }

  addMattressItemFormRow() {
    this.itemRowCount++;
    const container = document.getElementById('form-mattress-items-container');
    const rowId = `item-row-${this.itemRowCount}`;
    
    const catalog = window.PurpesDB.getCatalog();
    
    let modelOptions = '';
    catalog.forEach(m => {
      modelOptions += `<option value="${m.id}">${m.name} (${m.firmness})</option>`;
    });

    let thicknessOptions = '';
    window.STANDARD_THICKNESSES.forEach(t => {
      thicknessOptions += `<option value="${t}" ${t === 6 ? 'selected' : ''}>${t} inches</option>`;
    });

    const itemCard = document.createElement('div');
    itemCard.className = 'order-item-card';
    itemCard.id = rowId;
    itemCard.innerHTML = `
      <span class="item-badge-number">Mattress #${this.itemRowCount}</span>
      <button type="button" class="btn-remove-item" onclick="app.removeMattressItemFormRow('${rowId}')">×</button>
      
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">Mattress Model *</label>
          <select class="input-neu field-model" onchange="app.handleItemRowFieldChange('${rowId}')" required>
            ${modelOptions}
          </select>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Size Type *</label>
            <select class="input-neu field-size-type" onchange="app.handleSizeTypeChange('${rowId}')" required>
              <option value="Standard">Standard Size</option>
              <option value="Custom">Custom Dimensions</option>
            </select>
          </div>
          <div class="form-group field-std-size-container">
            <label class="form-label">Standard Size *</label>
            <select class="input-neu field-std-size" onchange="app.handleItemRowFieldChange('${rowId}')">
              <option value="Single">Single (36" x 72")</option>
              <option value="Double">Double (48" x 72")</option>
              <option value="Queen" selected>Queen (60" x 78")</option>
              <option value="King">King (72" x 78")</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Custom Dimensions block (hidden by default) -->
      <div class="form-row-3 field-custom-dims" style="display: none;">
        <div class="form-group">
          <label class="form-label">Width (Inches) *</label>
          <input type="number" class="input-neu field-width" value="60" min="20" max="120" oninput="app.handleItemRowFieldChange('${rowId}')">
        </div>
        <div class="form-group">
          <label class="form-label">Length (Inches) *</label>
          <input type="number" class="input-neu field-length" value="78" min="20" max="120" oninput="app.handleItemRowFieldChange('${rowId}')">
        </div>
        <div class="form-group">
          <label class="form-label">Thickness (Inches) *</label>
          <select class="input-neu field-thickness" onchange="app.handleItemRowFieldChange('${rowId}')">
            ${thicknessOptions}
          </select>
        </div>
      </div>

      <div class="form-row-3">
        <div class="form-group">
          <label class="form-label">Core / Material Spec *</label>
          <input type="text" class="input-neu field-core" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">Cover / Fabric Spec *</label>
          <input type="text" class="input-neu field-fabric" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">Thickness (Standard) *</label>
          <select class="input-neu field-std-thickness" onchange="app.handleItemRowFieldChange('${rowId}')">
            ${thicknessOptions}
          </select>
        </div>
      </div>

      <div class="form-row-3">
        <div class="form-group">
          <label class="form-label">Firmness Rating</label>
          <input type="text" class="input-neu field-firmness" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">Quantity *</label>
          <input type="number" class="input-neu field-qty" value="1" min="1" oninput="app.handleItemRowFieldChange('${rowId}')" required>
        </div>
        <div class="form-group">
          <label class="form-label">Calculated Unit Price (₹)</label>
          <input type="number" class="input-neu field-price" style="font-weight: 700; color: var(--color-blue);" oninput="app.handleManualPriceOverride('${rowId}')">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Customizations / Manufacturing Instructions</label>
        <input type="text" class="input-neu field-notes" placeholder="e.g. rounded corners, specific packaging, stitching details...">
      </div>
    `;

    container.appendChild(itemCard);
    
    // Initialize specifications fields and pricing for this new row
    this.syncItemSpecifications(rowId);
    this.recalculateFormTotal();
    
    // Initialize custom select styling for the new row
    this.initNeuSelects(itemCard);
  }

  removeMattressItemFormRow(rowId) {
    const container = document.getElementById('form-mattress-items-container');
    if (container.children.length <= 1) {
      alert('An order must contain at least one mattress item.');
      return;
    }
    const card = document.getElementById(rowId);
    if (card) {
      card.remove();
      this.recalculateFormTotal();
    }
  }

  handleSizeTypeChange(rowId) {
    const card = document.getElementById(rowId);
    const sizeType = card.querySelector('.field-size-type').value;
    const stdContainer = card.querySelector('.field-std-size-container');
    const customContainer = card.querySelector('.field-custom-dims');
    
    // Thickness fields are present in standard rows too
    const stdThickness = card.querySelector('.field-std-thickness');

    if (sizeType === 'Standard') {
      stdContainer.style.display = 'block';
      customContainer.style.display = 'none';
      stdThickness.closest('.form-group').style.display = 'block';
    } else {
      stdContainer.style.display = 'none';
      customContainer.style.display = 'grid';
      stdThickness.closest('.form-group').style.display = 'none'; // thickness is in customContainer
    }

    this.syncItemSpecifications(rowId);
  }

  handleItemRowFieldChange(rowId) {
    this.syncItemSpecifications(rowId);
  }

  handleManualPriceOverride(rowId) {
    // If the user manually overrides unit price, don't auto-overwrite immediately
    // but update the form total
    this.recalculateFormTotal();
  }

  syncItemSpecifications(rowId) {
    const card = document.getElementById(rowId);
    if (!card) return;

    const modelId = card.querySelector('.field-model').value;
    const sizeType = card.querySelector('.field-size-type').value;
    
    const dbModel = window.PurpesDB.getModel(modelId);
    if (!dbModel) return;

    // Fill read-only specs
    card.querySelector('.field-core').value = dbModel.coreMaterial;
    card.querySelector('.field-fabric').value = dbModel.fabricType;
    card.querySelector('.field-firmness').value = dbModel.firmness;

    // Calculate Price
    let w, l, h;
    if (sizeType === 'Standard') {
      const stdSize = card.querySelector('.field-std-size').value;
      h = parseInt(card.querySelector('.field-std-thickness').value);
      const sizeDef = window.STANDARD_SIZES[stdSize];
      w = sizeDef.w;
      l = sizeDef.l;
    } else {
      w = parseFloat(card.querySelector('.field-width').value) || 36;
      l = parseFloat(card.querySelector('.field-length').value) || 72;
      h = parseInt(card.querySelector('.field-thickness').value) || 5;
    }

    const calculatedPrice = window.PurpesDB.calculatePrice(modelId, sizeType, card.querySelector('.field-std-size').value, w, l, h);
    
    // Set Calculated Price input
    card.querySelector('.field-price').value = calculatedPrice;

    this.recalculateFormTotal();
  }

  recalculateFormTotal() {
    const container = document.getElementById('form-mattress-items-container');
    let totalQty = 0;
    let totalPrice = 0;

    container.querySelectorAll('.order-item-card').forEach(card => {
      const qty = parseInt(card.querySelector('.field-qty').value) || 0;
      const unitPrice = parseFloat(card.querySelector('.field-price').value) || 0;
      
      totalQty += qty;
      totalPrice += (qty * unitPrice);
    });

    document.getElementById('summary-total-qty').innerText = `${totalQty} mattress${totalQty !== 1 ? 'es' : ''}`;
    document.getElementById('summary-total-price').innerText = `₹${totalPrice.toLocaleString('en-IN')}`;
  }

  // Handle Form Submission (Add Order manually)
  submitOrderForm(event) {
    event.preventDefault();

    const customerName = document.getElementById('cust-name').value.trim();
    const customerPhone = document.getElementById('cust-phone').value.trim();
    const customerEmail = document.getElementById('cust-email').value.trim();
    const shippingAddress = document.getElementById('cust-address').value.trim();
    const orderShed = document.getElementById('order-shed').value;

    if (!orderShed) {
      alert("Please select a Production Shed.");
      return;
    }

    const items = [];
    const container = document.getElementById('form-mattress-items-container');
    
    let isValid = true;
    container.querySelectorAll('.order-item-card').forEach(card => {
      const modelId = card.querySelector('.field-model').value;
      const dbModel = window.PurpesDB.getModel(modelId);
      
      const sizeType = card.querySelector('.field-size-type').value;
      const standardSize = sizeType === 'Standard' ? card.querySelector('.field-std-size').value : 'N/A';
      
      let w, l, h;
      if (sizeType === 'Standard') {
        const sizeDef = window.STANDARD_SIZES[standardSize];
        w = sizeDef.w;
        l = sizeDef.l;
        h = parseInt(card.querySelector('.field-std-thickness').value);
      } else {
        w = parseFloat(card.querySelector('.field-width').value);
        l = parseFloat(card.querySelector('.field-length').value);
        h = parseInt(card.querySelector('.field-thickness').value);
      }

      const qty = parseInt(card.querySelector('.field-qty').value);
      const unitPrice = parseFloat(card.querySelector('.field-price').value);
      const specialInstructions = card.querySelector('.field-notes').value.trim();

      if (!qty || qty <= 0 || isNaN(unitPrice)) {
        isValid = false;
        return;
      }

      items.push({
        modelId,
        modelName: dbModel.name,
        sizeType,
        standardSize,
        width: w,
        length: l,
        thickness: h,
        coreMaterial: dbModel.coreMaterial,
        fabricType: dbModel.fabricType,
        firmness: dbModel.firmness,
        quantity: qty,
        unitPrice,
        totalPrice: qty * unitPrice,
        specialInstructions
      });
    });

    if (!isValid || items.length === 0) {
      alert('Please check mattress quantities and price configuration.');
      return;
    }

    const createdOrderIds = [];

    items.forEach(item => {
      const orderData = {
        salesPerson: this.currentRole === 'sales' ? 'Sarah Jenkins' : 'Operations Manager',
        customerName,
        customerPhone,
        customerEmail,
        shippingAddress,
        shed: orderShed,
        items: [item],
        totalAmount: item.totalPrice
      };
      
      const newOrder = window.PurpesDB.createOrder(orderData);
      createdOrderIds.push(newOrder.id);
    });

    alert(`Orders submitted successfully! Generated IDs: ${createdOrderIds.join(', ')}`);
    
    this.resetOrderForm();
    this.switchView('orders');
  }

  // --- CSV / Excel File Import and Export ---

  downloadExcelTemplate() {
    const headers = [
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Shipping Address',
      'Mattress Model (Ortho-Coir/Memory-Gel/Latex-Pure/Pocket-Comfort/Hybrid-Cloud)',
      'Size Type (Standard/Custom)',
      'Standard Size Name (Single/Double/Queen/King or leave empty if Custom)',
      'Width Inches',
      'Length Inches',
      'Thickness Inches',
      'Quantity',
      'Special Instructions'
    ];

    const dummyRows = [
      [
        'John Smith',
        '9876500001',
        'john@example.com',
        'Flat 101, Lakeview Apts, Bangalore',
        'Memory Gel',
        'Standard',
        'Queen',
        '',
        '',
        '6',
        '1',
        'Wrap extra carefully.'
      ],
      [
        'Alice Brown',
        '9876500002',
        'alice@example.com',
        '12 Park Avenue, Sector 5, Bangalore',
        'Latex Pure',
        'Custom',
        '',
        '64',
        '82',
        '8',
        '2',
        'Require rounded edge at feet corners.'
      ]
    ];

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
    
    // Add dummy rows
    dummyRows.forEach(row => {
      csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Purpes_Mattress_Orders_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    // Parse XLSX using SheetJS if library exists, or default to CSV text parsing
    reader.onload = (e) => {
      const data = e.target.result;
      let rows = [];

      try {
        if (typeof XLSX !== 'undefined') {
          // Process via SheetJS
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else {
          // Fallback to basic CSV string parsing
          const csvText = data;
          rows = csvText.split('\n').map(line => {
            // Very simple CSV column splitter
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          });
        }

        this.processExcelRows(rows);
      } catch (err) {
        console.error(err);
        alert('Error parsing uploaded file. Please verify it matches the template headers and structure.');
      }
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      if (typeof XLSX === 'undefined') {
        alert('SheetJS Excel library is loading, please wait a second and retry, or use a CSV file format.');
        return;
      }
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file); // Assume CSV
    }
  }

  processExcelRows(rows) {
    if (rows.length < 2) {
      alert('The spreadsheet has no order rows.');
      return;
    }

    // Identify indexes from headers (first row)
    const headers = rows[0].map(h => String(h).toLowerCase().trim());
    
    const findIndex = (terms) => {
      return headers.findIndex(h => terms.some(t => h.includes(t)));
    };

    const nameIdx = findIndex(['name', 'customer name']);
    const phoneIdx = findIndex(['phone', 'customer phone']);
    const emailIdx = findIndex(['email', 'customer email']);
    const addrIdx = findIndex(['address', 'shipping address']);
    const modelIdx = findIndex(['model', 'mattress model']);
    const sizeTypeIdx = findIndex(['size type', 'type']);
    const stdSizeIdx = findIndex(['standard size', 'size name']);
    const wIdx = findIndex(['width']);
    const lIdx = findIndex(['length']);
    const hIdx = findIndex(['thickness', 'height']);
    const qtyIdx = findIndex(['qty', 'quantity']);
    const notesIdx = findIndex(['instructions', 'notes']);

    if (nameIdx === -1 || phoneIdx === -1 || addrIdx === -1 || modelIdx === -1) {
      alert('Spreadsheet headers do not match the required template. Make sure Customer Name, Phone, Address, and Mattress Model columns exist.');
      return;
    }

    // Group rows by customer details to allow multiple mattress models in a single order
    const orderGroups = {};
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[nameIdx]) continue; // Skip empty rows

      const custName = String(row[nameIdx]).trim();
      const custPhone = String(row[phoneIdx]).trim();
      const groupKey = `${custName}_${custPhone}`;

      if (!orderGroups[groupKey]) {
        orderGroups[groupKey] = {
          customerName: custName,
          customerPhone: custPhone,
          customerEmail: emailIdx !== -1 ? String(row[emailIdx]).trim() : '',
          shippingAddress: addrIdx !== -1 ? String(row[addrIdx]).trim() : 'Factory Pick-up',
          items: []
        };
      }

      // Map Model
      const excelModel = String(row[modelIdx]).trim().toLowerCase();
      let modelId = 'model-ortho-coir'; // Fallback
      if (excelModel.includes('gel') || excelModel.includes('memory')) modelId = 'model-memory-gel';
      else if (excelModel.includes('latex')) modelId = 'model-latex-pure';
      else if (excelModel.includes('pocket') || excelModel.includes('spring')) modelId = 'model-pocket-comfort';
      else if (excelModel.includes('hybrid') || excelModel.includes('cloud')) modelId = 'model-hybrid-cloud';

      const dbModel = window.PurpesDB.getModel(modelId);

      // Map Sizes
      let sizeType = 'Standard';
      if (sizeTypeIdx !== -1 && String(row[sizeTypeIdx]).trim().toLowerCase() === 'custom') {
        sizeType = 'Custom';
      }

      let standardSize = 'Queen';
      if (stdSizeIdx !== -1 && sizeType === 'Standard') {
        const val = String(row[stdSizeIdx]).trim();
        if (['Single', 'Double', 'Queen', 'King'].includes(val)) {
          standardSize = val;
        }
      }

      // Dimensions
      let w = 60, l = 78, h = 6;
      if (sizeType === 'Standard') {
        const sizeDef = window.STANDARD_SIZES[standardSize];
        w = sizeDef.w;
        l = sizeDef.l;
        if (hIdx !== -1 && row[hIdx]) h = parseInt(row[hIdx]) || 6;
      } else {
        w = wIdx !== -1 && row[wIdx] ? parseFloat(row[wIdx]) : 36;
        l = lIdx !== -1 && row[lIdx] ? parseFloat(row[lIdx]) : 72;
        h = hIdx !== -1 && row[hIdx] ? parseInt(row[hIdx]) : 5;
      }

      const qty = qtyIdx !== -1 && row[qtyIdx] ? parseInt(row[qtyIdx]) || 1 : 1;
      const notes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : '';

      // Calculate Price
      const unitPrice = window.PurpesDB.calculatePrice(modelId, sizeType, standardSize, w, l, h);

      orderGroups[groupKey].items.push({
        modelId,
        modelName: dbModel.name,
        sizeType,
        standardSize,
        width: w,
        length: l,
        thickness: h,
        coreMaterial: dbModel.coreMaterial,
        fabricType: dbModel.fabricType,
        firmness: dbModel.firmness,
        quantity: qty,
        unitPrice,
        totalPrice: qty * unitPrice,
        specialInstructions: notes
      });
    }

    // Submit all created order groups
    let ordersCreatedCount = 0;
    Object.values(orderGroups).forEach(orderData => {
      if (orderData.items.length === 0) return;
      
      orderData.totalAmount = orderData.items.reduce((sum, it) => sum + it.totalPrice, 0);
      orderData.salesPerson = 'Sarah Jenkins (Excel)';
      
      window.PurpesDB.createOrder(orderData);
      ordersCreatedCount++;
    });

    alert(`Successfully parsed spreadsheet! Created ${ordersCreatedCount} new orders, awaiting Manager Approval.`);
    document.getElementById('order-excel-upload').value = ''; // Reset input
    
    this.refreshDashboard();
    this.renderOrdersList();
  }

  // --- Orders Database Screen ---

  renderOrdersList() {
    const orders = this.getFilteredOrders();
    const tbody = document.getElementById('orders-list-tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No orders registered.</td></tr>';
      return;
    }

    orders.forEach(o => {
      const formattedDate = new Date(o.orderDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      // Actions Column depending on user role and approval status
      let actionButtons = '';
      if (this.currentRole === 'shed_manager' || this.currentRole === 'super_admin') {
        if (o.status === 'Submitted') {
          actionButtons = `
            <button class="btn-neu sm success" onclick="app.approveOrder('${o.id}')">Approve</button>
            <button class="btn-neu sm danger" onclick="app.updateStatus('${o.id}', 'Cancelled')">Cancel</button>
          `;
        } else {
          actionButtons = `
            <button class="btn-neu sm primary" onclick="app.viewOrderSlip('${o.id}')">Order Slip</button>
            <button class="btn-neu sm" onclick="app.viewQuotation('${o.id}')">View Quotation</button>
          `;
        }
      } else if (this.currentRole === 'cashier') {
        actionButtons = `
          <button class="btn-neu sm primary" onclick="app.viewQuotation('${o.id}', true)">Invoice</button>
        `;
      } else {
        // Sales Rep
        actionButtons = `
          <button class="btn-neu sm primary" onclick="app.viewOrderSlip('${o.id}')">Order Slip</button>
          <button class="btn-neu sm" onclick="app.viewQuotation('${o.id}')">Quotation</button>
        `;
      }

      tbody.innerHTML += `
        <tr class="order-row-item" data-id="${o.id}" data-cust="${o.customerName.toLowerCase()}" data-phone="${o.customerPhone}" data-status="${o.status}" data-payment="${o.paymentStatus}">
          <td><strong>${o.id}</strong></td>
          <td>${o.customerName}<br><span style="font-size: 10px; color: var(--text-secondary);">${o.customerPhone}</span></td>
          <td>${formattedDate}</td>
          <td>₹${o.totalAmount.toLocaleString('en-IN')}</td>
          <td style="font-weight: 600; color: ${o.balanceAmount > 0 ? 'var(--color-orange)' : 'var(--color-green)'}">
            ₹${o.balanceAmount.toLocaleString('en-IN')}
          </td>
          <td><span class="badge-status ${o.status.toLowerCase()}">${o.status}</span></td>
          <td><span class="badge-payment ${o.paymentStatus.replace(' ', '-').toLowerCase()}">${o.paymentStatus}</span></td>
          <td>
            <div style="display: flex; gap: 6px;">
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    });
  }

  // Filter Search
  filterOrders() {
    const query = document.getElementById('order-search').value.toLowerCase().trim();
    const statusFilter = document.getElementById('filter-status').value;
    const paymentFilter = document.getElementById('filter-payment').value;

    document.querySelectorAll('.order-row-item').forEach(row => {
      const id = row.querySelector('strong').innerText.toLowerCase();
      const cust = row.getAttribute('data-cust');
      const phone = row.getAttribute('data-phone');
      
      const status = row.getAttribute('data-status');
      const payment = row.getAttribute('data-payment');

      const matchesSearch = id.includes(query) || cust.includes(query) || phone.includes(query);
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
      const matchesPayment = paymentFilter === 'ALL' || payment === paymentFilter;

      if (matchesSearch && matchesStatus && matchesPayment) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Manager Approval Methods
  approveOrder(orderId) {
    const approverName = this.currentUser ? this.currentUser.name : 'Operations Manager';
    window.PurpesDB.updateOrderStatus(orderId, 'Approved', approverName);
    alert(`Order ${orderId} approved! Quotation prepared and ledger record created.`);
    
    this.refreshDashboard();
    this.renderOrdersList();
  }

  updateStatus(orderId, status) {
    if (confirm(`Are you sure you want to change order ${orderId} status to ${status}?`)) {
      window.PurpesDB.updateOrderStatus(orderId, status);
      this.refreshDashboard();
      this.renderOrdersList();
    }
  }

  // --- Accounts Ledger Screen ---

  renderAccountsLedger() {
    const orders = this.getFilteredOrders();
    const tbody = document.getElementById('ledger-registry-tbody');
    tbody.innerHTML = '';

    // Calculate registry numbers
    let clearedFunds = 0;
    let outstanding = 0;
    let refunded = 0;

    const approvedOrders = orders.filter(o => o.status === 'Approved' || o.status === 'Processing' || o.status === 'Delivered');

    orders.forEach(o => {
      const pmts = o.payments.reduce((s, p) => s + p.amount, 0);
      const rfds = o.returnsRefunds.reduce((s, r) => s + r.amount, 0);
      
      clearedFunds += (pmts - rfds);
      refunded += rfds;
      
      if (o.status !== 'Cancelled') {
        outstanding += o.balanceAmount;
      }
    });

    document.getElementById('ledger-cleared').innerText = `₹${clearedFunds.toLocaleString('en-IN')}`;
    document.getElementById('ledger-receivable').innerText = `₹${outstanding.toLocaleString('en-IN')}`;
    document.getElementById('ledger-refunded').innerText = `₹${refunded.toLocaleString('en-IN')}`;

    if (approvedOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No approved orders in ledger pipeline.</td></tr>';
      return;
    }

    approvedOrders.forEach(o => {
      const totalPaid = o.payments.reduce((s, p) => s + p.amount, 0) - o.returnsRefunds.reduce((s, r) => s + r.amount, 0);
      
      let actionButtons = `
        <button class="btn-neu sm primary" onclick="app.openPaymentModal('${o.id}', 'payment')">Receive Payment</button>
        <button class="btn-neu sm danger" onclick="app.openPaymentModal('${o.id}', 'refund')">Return/Refund</button>
      `;

      tbody.innerHTML += `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.customerName}</td>
          <td>₹${o.totalAmount.toLocaleString('en-IN')}</td>
          <td style="color: var(--color-green); font-weight: 500;">₹${totalPaid.toLocaleString('en-IN')}</td>
          <td style="color: ${o.balanceAmount > 0 ? 'var(--color-orange)' : 'var(--color-green)'}; font-weight: 600;">
            ₹${o.balanceAmount.toLocaleString('en-IN')}
          </td>
          <td><span class="badge-payment ${o.paymentStatus.replace(' ', '-').toLowerCase()}">${o.paymentStatus}</span></td>
          <td>
            <div style="display: flex; gap: 6px;">
              ${actionButtons}
              <button class="btn-neu sm" onclick="app.viewQuotation('${o.id}', true)">Tax Invoice</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  // Opening receipt logs
  openPaymentModal(orderId, type) {
    const order = window.PurpesDB.getOrder(orderId);
    if (!order) return;

    document.getElementById('payment-order-id').value = orderId;
    document.getElementById('payment-action-type').value = type;

    // Reset Form fields
    document.getElementById('pay-amount').value = '';
    document.getElementById('pay-ref').value = '';
    document.getElementById('pay-notes').value = '';
    document.getElementById('pay-date').value = new Date().toISOString().slice(0, 16); // Local datetime string

    const summaryEl = document.getElementById('payment-order-summary');
    const modalTitle = document.getElementById('payment-modal-title');
    const amtLabel = document.getElementById('payment-amount-label');
    const submitBtn = document.getElementById('payment-submit-btn');

    if (type === 'payment') {
      modalTitle.innerText = `Record Offline Payment Received`;
      amtLabel.innerText = `Received Receipt Amount (₹) *`;
      submitBtn.innerText = `Receive Payment`;
      submitBtn.className = 'btn-neu primary';
      summaryEl.innerHTML = `
        <strong>Receiving Payment for Order ${orderId} (${order.customerName})</strong><br>
        Invoice Total: ₹${order.totalAmount.toLocaleString('en-IN')} | Outstanding Balance: <strong>₹${order.balanceAmount.toLocaleString('en-IN')}</strong>
      `;
      document.getElementById('pay-amount').max = order.balanceAmount; // Max allowed payment is outstanding balance
    } else {
      modalTitle.innerText = `Record Mattress Return & Refund Cash`;
      amtLabel.innerText = `Refunded Cash Amount (₹) *`;
      submitBtn.innerText = `Log Return/Refund`;
      submitBtn.className = 'btn-neu danger';
      const totalPaid = order.payments.reduce((s, p) => s + p.amount, 0) - order.returnsRefunds.reduce((s, r) => s + r.amount, 0);
      summaryEl.innerHTML = `
        <strong>Recording Returns / Refund for Order ${orderId} (${order.customerName})</strong><br>
        Net Amount Cleared: ₹${totalPaid.toLocaleString('en-IN')} | Maximum Refundable: <strong>₹${totalPaid.toLocaleString('en-IN')}</strong>
      `;
      document.getElementById('pay-amount').max = totalPaid; // Max allowed refund is amount already paid
    }

    this.openModal('modal-payment-entry');
  }

  submitPaymentForm(event) {
    event.preventDefault();

    const orderId = document.getElementById('payment-order-id').value;
    const type = document.getElementById('payment-action-type').value;
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const mode = document.getElementById('pay-mode').value;
    const ref = document.getElementById('pay-ref').value;
    const date = new Date(document.getElementById('pay-date').value).toISOString();
    const notes = document.getElementById('pay-notes').value.trim();

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid monetary amount.');
      return;
    }

    if (type === 'payment') {
      window.PurpesDB.recordPayment(orderId, { amount, paymentMode: mode, refNumber: ref, date, notes });
      alert(`Payment of ₹${amount.toLocaleString('en-IN')} logged successfully against Order ${orderId}.`);
    } else {
      window.PurpesDB.recordRefund(orderId, { amount, paymentMode: mode, refNumber: ref, date, notes });
      alert(`Mattress return refund of ₹${amount.toLocaleString('en-IN')} logged against Order ${orderId}.`);
    }

    this.closeModal('modal-payment-entry');
    this.refreshDashboard();
    this.renderAccountsLedger();
  }

  // --- User Management Screen ---
  
  renderUsersList() {
    const users = window.PurpesDB.getUsers();
    const tbody = document.getElementById('users-list-tbody');
    tbody.innerHTML = '';

    users.forEach(u => {
      // Don't allow editing the super admin role itself, just the username/password
      tbody.innerHTML += `
        <tr id="user-row-${u.username}">
          <td>${u.name}</td>
          <td><span class="badge-status" style="background: var(--color-purple-light); color: var(--color-purple);">${u.role} ${u.shedId ? '(' + u.shedId + ')' : ''}</span></td>
          <td><input type="text" class="input-neu" id="edit-username-${u.username}" value="${u.username}" disabled style="padding: 4px; font-size: 13px;"></td>
          <td><input type="text" class="input-neu" id="edit-password-${u.username}" value="${u.password}" disabled style="padding: 4px; font-size: 13px;"></td>
          <td>
            <button class="btn-neu sm" id="btn-edit-${u.username}" onclick="app.enableUserEdit('${u.username}')">Edit</button>
            <button class="btn-neu sm success" id="btn-save-${u.username}" onclick="app.saveUserChanges('${u.username}')" style="display: none;">Save</button>
          </td>
        </tr>
      `;
    });
  }

  enableUserEdit(username) {
    document.getElementById(`edit-username-${username}`).disabled = false;
    document.getElementById(`edit-password-${username}`).disabled = false;
    document.getElementById(`btn-edit-${username}`).style.display = 'none';
    document.getElementById(`btn-save-${username}`).style.display = 'inline-block';
  }

  saveUserChanges(oldUsername) {
    const newUsername = document.getElementById(`edit-username-${oldUsername}`).value.trim();
    const newPassword = document.getElementById(`edit-password-${oldUsername}`).value.trim();

    if (!newUsername || !newPassword) {
      alert('Username and password cannot be empty.');
      return;
    }

    const success = window.PurpesDB.updateUser(oldUsername, newUsername, newPassword);
    if (success) {
      alert(`User credentials updated successfully!`);
      this.renderUsersList();
    } else {
      alert(`Failed to update user.`);
    }
  }

  // --- PDF Quotation, Invoice & Order Slip Creator Sheets ---

  viewOrderSlip(orderId) {
    const order = window.PurpesDB.getOrders().find(o => o.id === orderId);
    if (!order) return;

    const paper = document.getElementById('printable-slip-content');
    
    const shed = order.shed || 'N/A';
    
    const item = order.items[0];
    let itemsHtml = `
      <div style="border: 2px dashed #000; padding: 15px; margin-bottom: 20px;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${item.modelName}</div>
        <div style="font-size: 32px; font-weight: 900; margin-bottom: 10px; background: #eee; padding: 5px;">
          MEASUREMENT: ${item.width}" x ${item.length}" x ${item.thickness}"
        </div>
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">
          Quantity: ${item.quantity}
        </div>
        <div style="font-size: 16px; margin-bottom: 5px;">
          <strong>Materials:</strong> ${item.coreMaterial}
        </div>
        <div style="font-size: 16px; margin-bottom: 5px;">
          <strong>Fabric:</strong> ${item.fabricType}
        </div>
        <div style="font-size: 16px; margin-bottom: 5px; color: #d00; font-weight: bold;">
          <strong>Instructions:</strong> ${item.specialInstructions || 'None'}
        </div>
      </div>
    `;

    paper.innerHTML = `
      <div style="text-align: center; border-bottom: 4px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="font-size: 40px; margin: 0; font-weight: 900;">ORDER SLIP</h1>
        <h2 style="font-size: 36px; margin: 10px 0 0; font-weight: bold;">ORDER NO: <span style="background:#000; color:#fff; padding: 0 10px;">${order.id}</span></h2>
        <h3 style="font-size: 24px; margin: 10px 0 0;">SHED: ${shed}</h3>
      </div>
      
      <div style="font-size: 20px; font-weight: bold; margin-bottom: 20px; border: 2px solid #000; padding: 15px;">
        <div>CUSTOMER: ${order.customerName}</div>
        <div>ORDER DATE: ${new Date(order.orderDate).toLocaleDateString()}</div>
      </div>
      
      ${itemsHtml}
    `;
    
    // Configure WhatsApp Button
    const waBtn = document.getElementById('btn-whatsapp');
    if (waBtn) {
      waBtn.onclick = () => this.sendWhatsApp(order.customerPhone, order.id);
    }
    
    this.openModal('modal-order-slip');
  }

  sendWhatsApp(phone, orderId) {
    if (!phone) {
      alert("No phone number available for this order.");
      return;
    }
    // Remove all non-digit characters
    let sanitized = phone.replace(/\D/g, '');
    
    // If it's a 10 digit Indian number, prepend 91
    if (sanitized.length === 10) {
      sanitized = '91' + sanitized;
    }
    
    const text = encodeURIComponent(`Hello! Here are the details for your Purpes ERP Order #${orderId}.`);
    const waLink = `https://wa.me/${sanitized}?text=${text}`;
    
    window.open(waLink, '_blank');
  }

  printSlip() {
    const content = document.getElementById('printable-slip-content').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Order Slip</title>
          <style>
            body { font-family: monospace; color: #000; padding: 20px; }
            @media print {
              @page { margin: 0.5cm; }
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  viewQuotation(orderId, isInvoice = false) {
    const order = window.PurpesDB.getOrder(orderId);
    if (!order) return;

    const modalTitle = document.getElementById('quotation-modal-title');
    modalTitle.innerText = isInvoice ? `Tax Invoice Preview (${orderId})` : `Quotation Details Sheet (${orderId})`;

    const paper = document.getElementById('printable-quotation-content');
    
    // Format Date
    const formattedDate = new Date(order.orderDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    // Populate mattress items list
    let itemRows = '';
    order.items.forEach((item, idx) => {
      const dimensions = item.sizeType === 'Standard' 
        ? `${item.standardSize} Size (${item.width}"x${item.length}"x${item.thickness}")`
        : `Custom Dimensions (${item.width}" x ${item.length}" x ${item.thickness}" Thickness)`;

      itemRows += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>
            <strong>${item.modelName} Mattress</strong><br>
            <span style="font-size: 10px; color: #6e6e73;">Specs: Core - ${item.coreMaterial} | Cover - ${item.fabricType}</span><br>
            <span style="font-size: 10px; color: #6e6e73;">Dimensions: ${dimensions}</span>
            ${item.specialInstructions ? `<br><span style="font-size: 10px; color: #af52de;">*Note: ${item.specialInstructions}</span>` : ''}
          </td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-weight: 600;">₹${item.totalPrice.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    // Calculate Payments Received
    const totalPayments = order.payments.reduce((s, p) => s + p.amount, 0) - order.returnsRefunds.reduce((s, r) => s + r.amount, 0);

    let paymentBreakdownSection = '';
    if (isInvoice) {
      paymentBreakdownSection = `
        <div class="q-total-row">
          <span>Total Payments Received:</span>
          <span style="color: #34c759;">₹${totalPayments.toLocaleString('en-IN')}</span>
        </div>
        <div class="q-total-row" style="border-top: 1px dashed #e1e1e6; padding-top: 4px;">
          <span>Outstanding Balance Due:</span>
          <span style="font-weight: bold; color: ${order.balanceAmount > 0 ? '#ff9500' : '#34c759'};">
            ₹${order.balanceAmount.toLocaleString('en-IN')}
          </span>
        </div>
      `;
    }

    paper.innerHTML = `
      <div class="q-header">
        <div>
          <div class="q-logo">PURPES MATTRESS CO.</div>
          <div style="font-size: 11px; color: #6e6e73; margin-top: 4px;">Premium Bespoke & Custom Mattress Manufacturer</div>
        </div>
        <div class="q-comp-info">
          <strong>Purpes Manufacturing Unit</strong><br>
          Survey No. 42/1, Industrial Estate Phase 2<br>
          Whitefield, Bangalore, KA - 560066<br>
          GSTIN: 29AAAAA0000A1Z2 | Ph: +91 9988776655
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
        <div>
          <div class="q-doc-title">${isInvoice ? 'TAX INVOICE' : 'QUOTATION'}</div>
          <div style="font-size: 12px; color: #6e6e73; margin-top: 2px;">
            Document Ref: <strong>${isInvoice ? 'INV' : 'QTN'}-${order.id.slice(4)}</strong>
          </div>
        </div>
        <div style="text-align: right; font-size: 12px;">
          Date: <strong>${formattedDate}</strong><br>
          Account Manager: <strong>${order.salesPerson}</strong>
        </div>
      </div>

      <div class="q-meta-grid">
        <div>
          <div class="q-bill-label">Billed / Shipped To:</div>
          <div class="q-bill-val"><strong>${order.customerName}</strong></div>
          <div style="color: #6e6e73; font-size: 12px; line-height: 1.4; margin-top: 4px;">
            Phone: ${order.customerPhone}<br>
            Email: ${order.customerEmail || 'N/A'}<br>
            Address: ${order.shippingAddress}
          </div>
        </div>
        <div style="border-left: 1px solid #e1e1e6; padding-left: 20px;">
          <div class="q-bill-label">Order Reference Details:</div>
          <div style="font-size: 12px; line-height: 1.5; color: #333;">
            Order Status: <strong style="color: #0071e3;">${order.status}</strong><br>
            Manager Approval: <strong>${order.approvedBy || 'Pending'}</strong><br>
            Approval Date: <strong>${order.approvalDate ? new Date(order.approvalDate).toLocaleDateString('en-IN') : 'N/A'}</strong>
          </div>
        </div>
      </div>

      <table class="q-items-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>Mattress Model & Specification details</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 100px; text-align: right;">Unit Price</th>
            <th style="width: 120px; text-align: right;">Total Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="font-size: 10px; color: #86868b; max-width: 450px; line-height: 1.4;">
          <strong>Terms and Conditions:</strong><br>
          1. Pricing includes local delivery and handling fees.<br>
          2. Custom sized mattresses are made to order and are <strong>non-refundable</strong> once production begins.<br>
          3. Standard thickness tolerances of ±0.5 inches apply due to foaming and fabrics compression.<br>
          4. Payments are processed offline. Please clear pending balances prior to dispatch schedule.
        </div>
        <div class="q-totals">
          <div class="q-total-row">
            <span>Sub-Total:</span>
            <span>₹${order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div class="q-total-row">
            <span>GST (18% inclusive):</span>
            <span>₹${Math.round(order.totalAmount * 0.18).toLocaleString('en-IN')}</span>
          </div>
          <div class="q-total-row grand">
            <span>Grand Total:</span>
            <span>₹${order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          ${paymentBreakdownSection}
        </div>
      </div>

      <div class="q-footer">
        Thank you for choosing Purpes Mattress. Sleep well!
      </div>
    `;

    // WhatsApp formatting handler
    const waShareBtn = document.getElementById('whatsapp-share-btn');
    waShareBtn.onclick = () => this.shareOnWhatsApp(order, isInvoice);

    this.openModal('modal-quotation');
  }

  // Share formatted text on WhatsApp
  shareOnWhatsApp(order, isInvoice = false) {
    const docType = isInvoice ? 'Tax Invoice' : 'Quotation';
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const prefix = cleanPhone.length === 10 ? '91' : ''; // default to India code if 10 digit

    let textMsg = `*PURPES MATTRESS CO.* \n`;
    textMsg += `Hello ${order.customerName},\n\n`;
    textMsg += `Here are your mattress order ${docType} details from our factory:\n`;
    textMsg += `*Order ID:* ${order.id}\n`;
    textMsg += `*Date:* ${new Date(order.orderDate).toLocaleDateString('en-IN')}\n\n`;
    
    textMsg += `*Mattress Specification Summary:*\n`;
    order.items.forEach((item, idx) => {
      const dims = item.sizeType === 'Standard' ? `${item.standardSize} Standard` : `${item.width}"x${item.length}" Custom`;
      textMsg += `${idx + 1}. ${item.modelName} (${dims}) x ${item.quantity} Qty\n`;
    });
    
    textMsg += `\n*Grand Total:* ₹${order.totalAmount.toLocaleString('en-IN')}\n`;
    if (isInvoice) {
      const pmts = order.payments.reduce((s, p) => s + p.amount, 0) - order.returnsRefunds.reduce((s, r) => s + r.amount, 0);
      textMsg += `*Paid Amount:* ₹${pmts.toLocaleString('en-IN')}\n`;
      textMsg += `*Balance Outstanding:* *₹${order.balanceAmount.toLocaleString('en-IN')}*\n`;
    }
    
    textMsg += `\nFor details, we have prepared a printable PDF quotation. Let us know if you need any adjustments!\n`;
    textMsg += `Thank you! \nPurpes Factory Sales Desk`;

    const encodedText = encodeURIComponent(textMsg);
    const waUrl = `https://wa.me/${prefix}${cleanPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  }

  // Print PDF directly
  printDocument() {
    window.print();
  }

  // Download PDF file using html2pdf.js CDN library
  downloadDocumentPDF() {
    const element = document.getElementById('printable-quotation-content');
    const docTitle = document.getElementById('quotation-modal-title').innerText.replace(/\s+/g, '_');
    
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin:       10,
        filename:     `${docTitle}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().from(element).set(opt).save();
    } else {
      // Fallback if CDN blocked/failed
      alert('PDF generation engine is downloading. Please wait a second and try again, or use the "Print" option to print/save as PDF.');
    }
  }

  // Modal helpers
  openModal(id) {
    document.getElementById(id).classList.add('active');
  }

  closeModal(id) {
    document.getElementById(id).classList.remove('active');
  }

  // Render Product Catalog Modal contents
  showCatalogModal() {
    const catalog = window.PurpesDB.getCatalog();
    const tbody = document.getElementById('catalog-table-body');
    tbody.innerHTML = '';
    
    catalog.forEach(m => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${m.name}</strong><br><span style="font-size: 10px; color: var(--text-secondary);">${m.description}</span></td>
          <td><span class="badge-status submitted" style="text-transform: capitalize; background: #e3f2fd; color: #0071e3;">${m.firmness}</span></td>
          <td style="font-size: 11px; color: var(--text-secondary); max-width: 200px;">${m.coreMaterial}</td>
          <td style="font-size: 11px; color: var(--text-secondary);">${m.fabricType}</td>
          <td style="font-weight: 600; color: var(--color-blue);">₹${m.basePrice.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    this.openModal('modal-catalog');
  }
}

// Global scope initialization
window.app = new PurpesApp();
