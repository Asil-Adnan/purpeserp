const fs = require('fs');
let dbCode = fs.readFileSync('database.js', 'utf8');

const syncLogic = `
  // --- Firebase Cloud Sync Logic ---
  initCloudSync() {
    this.firebaseConfig = {
      // TODO: Paste your Firebase config object here from Firebase Console
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    if (this.firebaseConfig.apiKey === "YOUR_API_KEY") {
      console.warn("Firebase config missing! Cloud sync is disabled.");
      return;
    }

    if (typeof firebase === 'undefined') {
      console.error("Firebase SDK not loaded in index.html");
      return;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(this.firebaseConfig);
    }
    this.db = firebase.firestore();

    this.syncFromCloud();
  }

  async syncFromCloud() {
    if (!this.db) return;
    try {
      // Fetch users
      const usersSnap = await this.db.collection('users').get();
      if (!usersSnap.empty) {
        const users = usersSnap.docs.map(doc => doc.data());
        localStorage.setItem('purpes_erp_users', JSON.stringify(users));
      } else {
        // Migrate local users to cloud
        const localUsers = this.getUsers();
        for (const u of localUsers) {
          await this.db.collection('users').doc(u.username).set(u);
        }
      }

      // Fetch catalog
      const catalogSnap = await this.db.collection('catalog').get();
      if (!catalogSnap.empty) {
        const catalog = catalogSnap.docs.map(doc => doc.data());
        localStorage.setItem('purpes_erp_catalog', JSON.stringify(catalog));
      } else {
        const localCatalog = this.getCatalog();
        for (const c of localCatalog) {
          await this.db.collection('catalog').doc(c.id).set(c);
        }
      }

      // Fetch orders
      const ordersSnap = await this.db.collection('orders').get();
      if (!ordersSnap.empty) {
        const orders = ordersSnap.docs.map(doc => doc.data());
        localStorage.setItem('purpes_erp_orders', JSON.stringify(orders));
      } else {
        const localOrders = this.getOrders();
        for (const o of localOrders) {
          await this.db.collection('orders').doc(o.id).set(o);
        }
      }
      
      console.log("Cloud sync complete!");
      // Refresh UI if app is loaded
      if (window.app && typeof window.app.refreshDashboard === 'function') {
        window.app.refreshDashboard();
        window.app.renderOrdersList();
      }
    } catch (e) {
      console.error("Cloud Sync Error:", e);
    }
  }

  pushToCloud(collection, id, data) {
    if (!this.db) return;
    this.db.collection(collection).doc(id).set(data).catch(e => console.error("Firebase Push Error:", e));
  }
`;

// Insert the syncLogic before the end of the class
dbCode = dbCode.replace(/}\s*\n\s*\/\/\s*Export database class globally for index\.html\/app\.js to use/, syncLogic + '\n}\n\n// Export database class globally for index.html/app.js to use');

// Add initCloudSync() to the constructor
if (!dbCode.includes('this.initCloudSync()')) {
  dbCode = dbCode.replace(/this\.init\(\);/, 'this.init();\n    this.initCloudSync();');
}

// Inject pushToCloud into mutators
dbCode = dbCode.replace(/localStorage\.setItem\(ORDERS_KEY, JSON\.stringify\(orders\)\);\s*return newOrder;/g, 'localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));\n    this.pushToCloud("orders", newOrder.id, newOrder);\n    return newOrder;');
dbCode = dbCode.replace(/localStorage\.setItem\(ORDERS_KEY, JSON\.stringify\(orders\)\);\s*return orders\[orderIndex\];/g, 'localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));\n    this.pushToCloud("orders", orders[orderIndex].id, orders[orderIndex]);\n    return orders[orderIndex];');
dbCode = dbCode.replace(/localStorage\.setItem\(USERS_KEY, JSON\.stringify\(users\)\);/g, 'localStorage.setItem(USERS_KEY, JSON.stringify(users));\n    if (typeof newUsername !== "undefined") this.pushToCloud("users", newUsername, users[index]);');
dbCode = dbCode.replace(/localStorage\.setItem\(ORDERS_KEY, JSON\.stringify\(orders\)\);\s*return newPayment;/g, 'localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));\n    this.pushToCloud("orders", orderId, order);\n    return newPayment;');
dbCode = dbCode.replace(/localStorage\.setItem\(ORDERS_KEY, JSON\.stringify\(orders\)\);\s*return newRefund;/g, 'localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));\n    this.pushToCloud("orders", orderId, order);\n    return newRefund;');

fs.writeFileSync('database.js', dbCode);
