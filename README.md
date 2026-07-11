# Purpes ERP — Mattress Manufacturing Workspace

Purpes ERP is a modern, light-themed, neumorphic web application built for a mattress manufacturing unit. The user interface borrows layout, typography, and clean spacing elements from the macOS design language, featuring glassmorphism, dynamic animations, and tactile cards.

---

## Key Features

1. **Multi-Role Workspace** (Accessible via the top macOS status bar):
   - **Sales Representative**: Manually draft orders with multiple mattresses, customize specifications (core, fabric, sizing), download the CSV template, or bulk-upload orders.
   - **Operations Manager**: View orders from all representatives, approve/reject orders, review pricing, and generate WhatsApp-ready quotations.
   - **Finance Head (Accounts)**: View approved orders, record offline receipts (Cash, UPI, Transfers), manage balances, handle returns/refunds, and generate professional Tax Invoices.
2. **Mattress Specifications Engine**:
   - Built-in configurations for models (Ortho-Coir, Memory Gel, Dunlop Latex, Pocket Springs, etc.).
   - Standard sizes (Single, Double, Queen, King) and custom dimension inputs (inches).
   - Automated mathematical calculation of prices for custom shapes (volume-based pricing).
3. **Document Printer & PDF Generator**:
   - Styled print stylesheets for clean A4 printouts.
   - Offline-capable PDF generator using the standard browser print engine or `html2pdf.js` for instant local file storage.
4. **WhatsApp Dispatcher**:
   - Automates message formatting, complete with items list, total amounts, and payment summaries.
   - Dispatches chat redirects via the official WhatsApp API.
5. **Persistence**:
   - All state is managed locally via `localStorage` with preloaded realistic mock data.

---

## Running Locally

### Option A: Standard Web browser (Zero Install)
Simply double-click the [index.html](file:///d:/Purpes%20ERP/index.html) file to open it directly in Google Chrome, Microsoft Edge, or Safari.

### Option B: Local Dev Server (Recommended)
To run with hot reloading and proper local asset resolution:
1. Open your terminal in the workspace directory: `d:\Purpes ERP`
2. Install the lightweight development server:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Open the generated local URL (usually `http://localhost:5173`) in your browser.
