// Purpes ERP Local Database Manager

const CATALOG_KEY = 'purpes_erp_catalog';
const ORDERS_KEY = 'purpes_erp_orders';
const USERS_KEY = 'purpes_erp_users';
const SLIP_COUNTERS_KEY = 'purpes_erp_slip_counters';

// Default Mattress Catalog Models
const DEFAULT_CATALOG = [
  {
    id: 'model-ortho-coir',
    name: 'Purpes Ortho-Coir',
    firmness: 'Firm',
    coreMaterial: 'Rubberized Coir & High Density Foam',
    fabricType: 'Quilted Premium Knitted',
    basePrice: 8500, // Price for standard Single size (36" x 72" x 5")
    cubicInchFactor: 0.65, // For custom sizes
    description: 'Designed for orthopedic back support, combining natural coir fibers with high-density rebonded foam.'
  },
  {
    id: 'model-memory-gel',
    name: 'Purpes Memory Gel',
    firmness: 'Medium Soft',
    coreMaterial: 'Cool Gel Memory Foam & Ortho Support Foam',
    fabricType: 'Breathable Aloe Vera Microfiber',
    basePrice: 13500, // Price for standard Single size
    cubicInchFactor: 1.05,
    description: 'Contours to your body shape while keeping you cool. Excellent pressure relief and luxury feel.'
  },
  {
    id: 'model-latex-pure',
    name: 'Purpes Latex Pure',
    firmness: 'Medium',
    coreMaterial: '100% Natural Dunlop Latex',
    fabricType: 'Organic Bamboo Knitted Fabric',
    basePrice: 17500, // Price for standard Single size
    cubicInchFactor: 1.35,
    description: 'Eco-friendly, highly resilient, and naturally hypoallergenic mattress made from pure latex.'
  },
  {
    id: 'model-pocket-comfort',
    name: 'Purpes Pocket Comfort',
    firmness: 'Medium Soft',
    coreMaterial: 'Individually Pocketed Springs & Soft Foam Layer',
    fabricType: 'Luxury High-GSM Quilted Fabric',
    basePrice: 11000, // Price for standard Single size
    cubicInchFactor: 0.85,
    description: 'Zero partner disturbance with individually pocketed coils that conform perfectly to body curves.'
  },
  {
    id: 'model-hybrid-cloud',
    name: 'Purpes Hybrid Cloud',
    firmness: 'Plush / Extra Soft',
    coreMaterial: 'Pocket Springs + Natural Latex + Gel Memory Foam Layer',
    fabricType: 'Double Jacquard Micro-Quilted Luxury fabric',
    basePrice: 22000, // Price for standard Single size
    cubicInchFactor: 1.70,
    description: 'Our ultimate luxury model combining latex resilience, memory foam cooling, and spring support.'
  }
];

// Predefined Users
const DEFAULT_USERS = [
  { username: 'admin', password: 'Diwani@2026', name: 'Super Admin', role: 'super_admin' },
  { username: 'manager_b1', password: '123', name: 'Manager B1', role: 'shed_manager', shedId: 'B1' },
  { username: 'manager_b2', password: '123', name: 'Manager B2', role: 'shed_manager', shedId: 'B2' },
  { username: 'manager_b3', password: '123', name: 'Manager B3', role: 'shed_manager', shedId: 'B3' },
  { username: 'manager_b4', password: '123', name: 'Manager B4', role: 'shed_manager', shedId: 'B4' },
  { username: 'manager_b5', password: '123', name: 'Manager B5', role: 'shed_manager', shedId: 'B5' },
  { username: 'manager_b6', password: '123', name: 'Manager B6', role: 'shed_manager', shedId: 'B6' },
  { username: 'cashier', password: '123', name: 'Cashier', role: 'cashier' },
  { username: 'sales_1', password: '123', name: 'Sales Agent 1', role: 'sales' },
  { username: 'sales_2', password: '123', name: 'Sales Agent 2', role: 'sales' }
];

// Standard Sizes definitions
const STANDARD_SIZES = {
  'Single': { w: 36, l: 72, factor: 1.0 },
  'Double': { w: 48, l: 72, factor: 1.3 },
  'Queen': { w: 60, l: 78, factor: 1.6 },
  'King': { w: 72, l: 78, factor: 1.9 }
};

// Default Thicknesses
const STANDARD_THICKNESSES = [4, 5, 6, 8, 10]; // in inches

// Mock Orders (Cleared)
const MOCK_ORDERS = [];

class PurpesDB {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(CATALOG_KEY)) {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(DEFAULT_CATALOG));
    }
    if (!localStorage.getItem(ORDERS_KEY)) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(MOCK_ORDERS));
    } else {
      // Cleanup legacy sample orders from local storage
      let orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
      const sampleIds = ['ORD-2026-0001', 'ORD-2026-0002', 'ORD-2026-0003'];
      const filtered = orders.filter(o => !sampleIds.includes(o.id));
      if (filtered.length !== orders.length) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
      }
    }
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    } else {
      // Ensure admin password is updated to Diwani@2026 if it's currently 123
      let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      const adminUser = users.find(u => u.username === 'admin');
      if (adminUser && adminUser.password === '123') {
        adminUser.password = 'Diwani@2026';
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
  }

  // Auth Methods
  login(username, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || DEFAULT_USERS;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      sessionStorage.setItem('current_user', JSON.stringify(user));
      return user;
    }
    return null;
  }

  logout() {
    sessionStorage.removeItem('current_user');
  }

  getCurrentUser() {
    const user = sessionStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  }

  // User Management Methods
  getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || DEFAULT_USERS;
  }

  updateUser(oldUsername, newUsername, newPassword) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.username === oldUsername);
    if (index > -1) {
      users[index].username = newUsername;
      users[index].password = newPassword;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Update session if it's the current user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.username === oldUsername) {
        currentUser.username = newUsername;
        currentUser.password = newPassword;
        sessionStorage.setItem('current_user', JSON.stringify(currentUser));
      }
      return true;
    }
    return false;
  }

  // Catalog Methods
  getCatalog() {
    return JSON.parse(localStorage.getItem(CATALOG_KEY));
  }

  getModel(id) {
    return this.getCatalog().find(m => m.id === id);
  }

  // Orders Methods
  getOrders() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  }

  getOrder(id) {
    return this.getOrders().find(o => o.id === id);
  }

  saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  createOrder(orderData) {
    const orders = this.getOrders();
    let newId = '';
    
    if (orderData.shed) {
      // Use shed name prefix for order ID
      const countersJson = localStorage.getItem(SLIP_COUNTERS_KEY);
      let counters = {};
      if (countersJson) {
        try { counters = JSON.parse(countersJson); } catch(e) {}
      }
      if (!counters[orderData.shed]) {
        counters[orderData.shed] = 1;
      } else {
        counters[orderData.shed]++;
      }
      localStorage.setItem(SLIP_COUNTERS_KEY, JSON.stringify(counters));
      newId = `${orderData.shed}-${counters[orderData.shed]}`;
    } else {
      const prefix = 'ORD-2026-';
      const nextNum = String(orders.length + 1).padStart(4, '0');
      newId = prefix + nextNum;
    }
    const currentUser = this.getCurrentUser();
    
    const newOrder = {
      id: newId,
      salesPerson: currentUser ? currentUser.name : (orderData.salesPerson || 'Sales Representative'),
      salesPersonId: currentUser ? currentUser.username : null,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      shippingAddress: orderData.shippingAddress,
      shed: orderData.shed || 'N/A',
      orderDate: new Date().toISOString(),
      status: 'Submitted', // Initially submitted
      items: orderData.items.map((item, idx) => ({
        itemId: `item-${orders.length + 1}-${idx + 1}`,
        ...item
      })),
      totalAmount: orderData.totalAmount,
      approvedBy: null,
      approvalDate: null,
      payments: [],
      returnsRefunds: [],
      balanceAmount: orderData.totalAmount,
      paymentStatus: 'Unpaid'
    };

    orders.unshift(newOrder); // Add to the top
    this.saveOrders(orders);
    return newOrder;
  }

  updateOrderStatus(orderId, status, approvedBy = null) {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      orders[orderIndex].status = status;
      if (status === 'Approved') {
        orders[orderIndex].approvedBy = approvedBy || 'Manager';
        orders[orderIndex].approvalDate = new Date().toISOString();
      }
      this.saveOrders(orders);
      return orders[orderIndex];
    }
    return null;
  }

  // Accounting Transactions
  recordPayment(orderId, paymentData) {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      const order = orders[orderIndex];
      const transactionId = `TXN-${Date.now()}`;
      
      const newPayment = {
        transactionId,
        date: paymentData.date || new Date().toISOString(),
        amount: parseFloat(paymentData.amount),
        paymentMode: paymentData.paymentMode,
        refNumber: paymentData.refNumber || '',
        notes: paymentData.notes || ''
      };

      order.payments.push(newPayment);

      // Recalculate Balance and paymentStatus
      this.recalculateBalances(order);
      
      this.saveOrders(orders);
      return order;
    }
    return null;
  }

  recordRefund(orderId, refundData) {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      const order = orders[orderIndex];
      const refundId = `REF-${Date.now()}`;
      
      const newRefund = {
        transactionId: refundId,
        date: refundData.date || new Date().toISOString(),
        amount: parseFloat(refundData.amount),
        paymentMode: refundData.paymentMode || 'Refund Mode',
        refNumber: refundData.refNumber || '',
        notes: refundData.notes || '',
        isRefund: true // Mark as refund
      };

      order.returnsRefunds.push(newRefund);

      // Recalculate Balance and paymentStatus
      this.recalculateBalances(order);
      
      this.saveOrders(orders);
      return order;
    }
    return null;
  }

  recalculateBalances(order) {
    const totalPayments = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunds = order.returnsRefunds.reduce((sum, r) => sum + r.amount, 0);
    
    // Balance formula: Total invoice - Payments + Refunds
    order.balanceAmount = Math.max(0, order.totalAmount - totalPayments + totalRefunds);
    
    const netPaid = totalPayments - totalRefunds;

    if (netPaid <= 0) {
      order.paymentStatus = 'Unpaid';
    } else if (netPaid >= order.totalAmount) {
      order.paymentStatus = 'Paid';
    } else {
      order.paymentStatus = 'Partially Paid';
    }
  }

  // Help calculate product prices
  calculatePrice(modelId, sizeType, standardSizeName, w, l, h) {
    const model = this.getModel(modelId);
    if (!model) return 0;

    if (sizeType === 'Standard') {
      const sizeDef = STANDARD_SIZES[standardSizeName];
      if (!sizeDef) return 0;
      // standard basePrice * size factor * height factor (assume base height is 5 inches)
      const heightFactor = h ? (h / 5) : 1;
      return Math.round(model.basePrice * sizeDef.factor * heightFactor);
    } else {
      // Custom pricing based on cubic inches
      // base price factor calculated as: (W * L * H) * cubicInchFactor
      const wVal = parseFloat(w) || 36;
      const lVal = parseFloat(l) || 72;
      const hVal = parseFloat(h) || 5;
      
      const cubicVolume = wVal * lVal * hVal;
      // Formula matches standard Single roughly: 36 * 72 * 5 = 12960 cubic inches
      // Base Price per cubic inch relative to the standard Single volume
      const baseCubicInches = 12960;
      const customPrice = model.basePrice * (cubicVolume / baseCubicInches) * 1.1; // Add 10% premium for custom cuts
      return Math.round(customPrice);
    }
  }
}

// Export database class globally for index.html/app.js to use
window.PurpesDB = new PurpesDB();
window.STANDARD_SIZES = STANDARD_SIZES;
window.STANDARD_THICKNESSES = STANDARD_THICKNESSES;
