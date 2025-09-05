Given the current flow of KLYNTL, which is the Customer & Marketing module, the main user flows are designed around empowering Nigerian SMEs to manage their customer relationships and eventually their marketing efforts effectively. The MVP focuses on core functionalities, keeping the user experience simple and efficient.

Here are the main user flows, described in detail:

---

### **Main User Flow 1: Onboarding & First Customer Setup**

This flow guides a new user from installing the app to successfully adding their first customer, demonstrating immediate value.

1. **Launch App & Welcome Screens:**
   - **User Action:** User downloads and opens KLYNTL for the first time.
   - **System Action:** Displays 3-4 welcome/introductory screens highlighting KLYNTL's value proposition (e.g., "Manage Customers Easily," "Track Sales," "Grow Your Business").
   - **UI/UX Focus:** Engaging visuals, clear, concise text, and a prominent "Get Started" button.
2. **Permission Requests:**
   - **User Action:** Taps "Get Started."
   - **System Action:** Prompts for necessary permissions (e.g., "KLYNTL needs access to your contacts to help you import customers quickly").
   - **UI/UX Focus:** Clear explanation of _why_ each permission is needed, with "Allow" or "Deny" options.
3. **Prompt for First Customer:**
   - **User Action:** Grants permissions.
   - **System Action:** Presents a screen asking the user to add their first customer.
   - **UI/UX Focus:** A clear call-to-action (e.g., "Add Your First Customer"), perhaps with two prominent buttons: "Import from Phone" and "Add Manually."
4. **Add First Customer (Choose an Option):**
   - **User Action:** Selects either "Import from Phone" or "Add Manually."
   - **System Action (Import):** Opens native contact picker.
     - **User Action (Import):** Selects one or more contacts.
     - **System Action (Import):** Imports selected contacts and populates KLYNTL's customer directory. Displays success message.
   - **System Action (Manual):** Navigates to the "Add Customer" screen.
     - **User Action (Manual):** Fills in customer details (Name, Phone, Email, Address).
     - **System Action (Manual):** Saves the new customer. Displays success message.
   - **UI/UX Focus:** Frictionless process, clear feedback. For manual entry, pre-fills fields if possible, auto-validates Nigerian phone numbers.
5. **View First Customer:**
   - **System Action:** Automatically navigates to the newly added customer's profile screen or the main customer list.
   - **UI/UX Focus:** Immediately shows the user their added customer, confirming the action and providing a sense of accomplishment.

---

### **Main User Flow 2: Customer Management & Interaction**

This flow covers daily operations related to managing customer information and initiating communication.

1. **Access Customer List:**
   - **User Action:** Taps the "Customers" tab in the bottom navigation.
   - **System Action:** Displays the "Customer List Screen."
   - **UI/UX Focus:** Clean, sortable list of customers, prominent search bar, and "Add Customer" button.
2. **Search/Filter Customers:**
   - **User Action:** Types into the search bar or applies a filter.
   - **System Action:** Real-time filtering/searching of the customer list.
   - **UI/UX Focus:** Fast, responsive search. Suggestions for common Nigerian names.
3. **View Customer Profile:**
   - **User Action:** Taps on a customer from the list.
   - **System Action:** Navigates to the "Customer Profile Screen."
   - **UI/UX Focus:** Organized layout of contact info, transaction history, and quick action buttons.
4. **Edit Customer Details:**
   - **User Action:** Taps "Edit" button on Customer Profile.
   - **System Action:** Opens an editable form pre-filled with customer details.
   - **User Action:** Modifies details and taps "Save."
   - **System Action:** Updates customer record. Displays success message.
   - **UI/UX Focus:** Clear "Save" and "Cancel" options.
5. **Initiate Manual Message:**
   - **User Action:** Taps "Send Message" button on Customer Profile.
   - **System Action:** KLYNTL deep-links to the native WhatsApp or SMS app with the customer's phone number pre-populated.
   - **UI/UX Focus:** Seamless transition to external app, clear indication of where the user is being directed.

---

### **Main User Flow 3: Recording Transactions**

This flow enables business owners to quickly log sales and payments, updating customer records and financial insights.

1. **Start Transaction Recording (Choose an Option):**
   - **User Action (Option A):** Taps "Add Transaction" button directly on a "Customer Profile Screen."
   - **User Action (Option B):** Taps a general "Add Transaction" button (e.g., on the main "Customers" screen) and then selects a customer from a list/search.
   - **System Action:** Navigates to the "Record Transaction Screen."
2. **Fill Transaction Details:**
   - **User Action:** Selects transaction type (Sale, Payment, Credit, Refund), enters amount (in Naira ₦), adds optional description, confirms date, and sets payment status.
   - **System Action:** Validates input.
   - **UI/UX Focus:** Intuitive form with clear labels, numeric keyboard for amount, easy date picker, and appropriate defaults (e.g., current date).
3. **Save Transaction:**
   - **User Action:** Taps "Save."
   - **System Action:** Records the transaction, updates the customer's transaction history, and adjusts their outstanding balance. Displays success message.
   - **UI/UX Focus:** Immediate feedback that the transaction was recorded, seamless update to relevant data.
4. **View Updated History:**
   - **System Action:** Returns to the Customer Profile screen, showing the newly added transaction and updated outstanding balance.
   - **UI/UX Focus:** Clear visual confirmation of the updated record.

---

### **Main User Flow 4: Checking Business Performance (Analytics)**

This flow allows users to gain quick insights into their business's overall health and customer behavior.

1. **Access Analytics Dashboard:**
   - **User Action:** Taps the "Reports" tab in the bottom navigation.
   - **System Action:** Displays the "Analytics Dashboard Screen."
   - **UI/UX Focus:** Visually clear dashboard with summary statistics and simple charts.
2. **View Key Metrics:**
   - **User Action:** Scans the dashboard.
   - **System Action:** Presents "Total Customers," "Recent Revenue," and "Top Customers" (by revenue/transactions) metrics.
   - **UI/UX Focus:** Prominent display of key numbers. Charts should be easy to interpret at a glance, using clear legends and axis labels.
3. **Offline Data Handling for Analytics:**
   - **System Action (Offline):** Dashboard shows data based on locally stored information.
   - **System Action (Online):** Dashboard updates with synchronized data from the cloud.
   - **UI/UX Focus:** A subtle indicator on the dashboard to show when data was last synced or if it's currently offline.

---

### **Main User Flow 5: Online Store (Basic Product & Order Management)**

This flow focuses on the initial steps for setting up a basic online store and viewing orders.

1. **Access Store Builder:**
   - **User Action:** Taps the "Store" tab in the bottom navigation.
   - **System Action:** Displays the "Product Catalog Builder Screen."
2. **Add/Edit Product:**
   - **User Action:** Taps "Add Product" or selects an existing product to edit.
   - **System Action:** Presents a form for product details (Name, Description, Images, Price, Inventory Count).
   - **User Action:** Fills in details, uploads images, sets price. Taps "Save."
   - **UI/UX Focus:** Intuitive image upload, clear fields, real-time preview of how the product looks in the store template.
3. **View Incoming Orders:**
   - **User Action:** From the "Store" screen, navigates to "Orders" (e.g., a sub-tab or dedicated button).
   - **System Action:** Displays the "Order Management Screen" with a list of recent orders.
   - **UI/UX Focus:** Clear list of orders with status (e.g., "New," "Processing"), customer name, and total amount.
4. **View Order Details:**
   - **User Action:** Taps on an order from the list.
   - **System Action:** Shows "Order Details" including customer information, ordered items, and shipping address.
   - **UI/UX Focus:** Ability to quickly initiate contact with the customer (deep link to WhatsApp/SMS) regarding the order.

---
