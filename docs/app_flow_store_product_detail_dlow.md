### **Store & Products: Detailed User Flows & Functionality**

The "Store" module in Klyntl is designed to be a simple, hassle-free way for Nigerian SMEs to create an online presence and manage orders. The flows are built to mirror the simplicity of a digital catalog and an efficient order book, much like a digital version of what they already do manually.

---

### **Main User Flow 1: Product Management (Catalog Setup)**

This flow details how a user sets up and manages their product catalog, which forms the basis of their online store.

**Entry Point:**

- From the **Bottom Navigation Bar:** Tapping the `Store` tab.

**Screen: Product Catalog Builder**

- **Header:** Displays "Your Online Store" or "Product Catalog."
- **Initial State:** If no products exist, the screen shows a prominent "Add Your First Product" button or a clear call to action.
- **Visuals:** A grid or list view showing all products.
- **Key Action:** A floating action button (FAB) or a prominent "Add Product" button.

#### **Sub-Flow: Adding a New Product**

1. **User Action:** Taps "Add Product."
2. **Screen:** **Add New Product**
3. **Key Fields:**
   - **Product Name:** Simple text input (e.g., "Jollof Rice & Chicken," "Men's Kaftan").
   - **Description:** A text area for more details about the product.
   - **Price:** A numeric input for the selling price, auto-formatted in Naira (₦).
   - **Product Type:** A dropdown or segmented control to differentiate between:
     - **Physical Item (Default):** Requires inventory tracking.
     - **Service:** No inventory required (e.g., "Haircut," "Phone Repair").
   - **Inventory (Conditional Field):** Appears if "Physical Item" is selected.
     - **Stock Quantity:** Numeric input for how many are in stock.
     - **Low Stock Alert:** A toggle to set an alert when stock drops below a certain number.
   - **Photos:** A button to add product images from the phone's gallery or camera.
   - **Publish Status:** A toggle to make the product visible in the online store immediately.
4. **User Action:** Fills in details and taps "Save."
5. **System Action:** Saves the product and adds it to the catalog. Displays a success message like "Product added!"

#### **Sub-Flow: Editing an Existing Product**

1. **User Action:** Taps on a product from the `Product Catalog` screen.
2. **Screen:** **Product Details / Edit**
3. **Key Actions:**
   - Pre-filled form with all the product's existing information.
   - A "Delete Product" option (with a confirmation prompt).
   - A "Save Changes" button.

---

### **Main User Flow 2: Order Management**

This flow focuses on what happens after a customer places an order on the Klyntl-powered online store.

**Entry Point:**

- From the **Bottom Navigation Bar:** Tapping the `Store` tab, then navigating to the "Orders" section.

**Screen: Orders List**

- **Header:** Displays "Incoming Orders."
- **Visuals:** A list or table view of all orders, sorted by date. Each entry should show:
  - Order Number
  - Customer Name
  - Total Amount
  - Order Status (e.g., "Pending," "Confirmed," "Fulfilled")
  - Timestamp

#### **Sub-Flow: Viewing & Managing a Specific Order**

1. **User Action:** Taps on a specific order from the `Orders List`.
2. **Screen:** **Order Details**
3. **Key Sections:**
   - **Order Summary:**
     - Order Number, Date & Time.
     - Total Amount & Payment Status (e.g., "Unpaid," "Paid," "Partially Paid").
   - **Customer Information:**
     - Customer's Name and Contact details.
     - Direct action buttons to **call, text, or WhatsApp** the customer.
     - Customer's Address for delivery (if applicable).
   - **Itemized List:**
     - A clear list of all products in the order, with quantities and individual prices.
   - **Order Status:**
     - A status bar or dropdown to update the order's progress (e.g., "Pending," "Confirmed," "Out for Delivery," "Fulfilled").
4. **User Action:** Updates the order status.
5. **System Action:**
   - **Updates Order Status:** The change is saved and reflected in the `Orders List`.
   - **Inventory Update:** If the order status is set to "Fulfilled," the app automatically **deducts the sold items from the inventory** to keep stock counts accurate.
   - **Transaction Record:** A new `Sale` transaction is automatically created in the `Customer Profile` (found in the `Customers` tab). This transaction is initially marked as "Unpaid" or "Pending" until the business owner confirms payment.

#### **Sub-Flow: Recording Payment for an Online Order**

This is a critical link to the transaction flow.

1. **User Action:** Taps a "Mark as Paid" or "Record Payment" button on the `Order Details` screen.
2. **Screen:** **Record Transaction (pre-filled)**
3. **System Action:** The `Record Transaction` form opens with the following fields automatically pre-filled:
   - **Customer:** Pre-selected with the customer from the order.
   - **Transaction Type:** Set to "Payment Received."
   - **Amount:** The total value of the order.
4. **User Action:** Confirms the payment method (Cash, Bank Transfer, etc.) and saves.
5. **System Action:** The payment is recorded, the customer's balance is updated, and the order's payment status is updated to "Paid."

---

### **How Store & Products Connect to the Core App**

This modular approach ensures data consistency across the app.

- **Customer Integration:** Every online order automatically creates a new customer profile (if they don't exist) or updates an existing one, directly linking the online store to the core customer database.
- **Transaction Integration:** Every confirmed order automatically logs a transaction, ensuring that sales from the online store are included in the business's overall reports and financial tracking.
- **Reports Integration:** All sales from the online store are automatically included in the `Reports` tab's analytics, providing a unified view of all business activities.
