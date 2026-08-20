# E-Commerce Admin Dashboard - Testing Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to `https://localhost:5173` (or whatever URL shown in terminal)

## 📋 Testing Steps

### 🔐 Authentication Testing
1. **Login Page** (`/login`)
   - Try logging in with any email/password (mock authentication)
   - Check form validation
   - Test "Forgot Password" and "Register" links

### 📊 Dashboard Testing
1. **Main Dashboard** (`/`)
   - Verify all statistics cards show data
   - Check charts render correctly
   - Test recent orders table
   - Verify top products chart

### 📦 Products Management Testing
1. **Products Page** (`/products`)
   - **View Products**: Check if 8 mock products load with 1-second delay
   - **Search**: Try searching for "laptop", "mouse", etc.
   - **Sort**: Click on Price and Stock columns to sort
   - **Add Product**: 
     - Click "Add Product" button
     - Fill form with test data
     - Submit and verify success message
   - **Edit Product**:
     - Click "Edit" on any product
     - Modify details and save
   - **Delete Product**:
     - Click "Delete" on any product
     - Confirm deletion in modal

### 👥 Customers Management Testing
1. **Customers Page** (`/customers`)
   - **View Customers**: Check if 6 mock customers load
   - **Search**: Try searching for customer names or emails
   - **Add Customer**:
     - Click "Add Customer" button
     - Fill form with test data
     - Submit and verify success message
   - **Edit Customer**:
     - Click "Edit" on any customer
     - Modify details and save
   - **Delete Customer**:
     - Click "Delete" on any customer
     - Confirm deletion

### 📁 Categories Management Testing
1. **Categories Page** (`/categories`)
   - **View Categories**: Check if mock categories load
   - **Add Category**: Create new categories
   - **Edit Category**: Modify existing categories
   - **Delete Category**: Remove categories

### 📦 Inventory Management Testing
1. **Inventory Page** (`/inventory`)
   - **View Inventory**: Check stock levels and status
   - **Stock Alerts**: Verify low-stock items are highlighted
   - **Update Stock**: Modify stock quantities
   - **Search**: Filter by product name or SKU

### 📈 Analytics Testing
1. **Analytics Page** (`/analytics`)
   - **Dashboard Stats**: Verify metrics display correctly
   - **Sales Charts**: Check line and bar charts
   - **Category Distribution**: Verify pie chart
   - **Date Filters**: Test date range selection

### ⚙️ Settings Testing
1. **Settings Page** (`/settings`)
   - **General Settings**: Modify store information
   - **Notifications**: Configure notification preferences
   - **Security**: Test security settings
   - **Appearance**: Change theme settings

## 🧪 Specific Test Cases

### Products CRUD Operations
1. **Create Product**:
   - Name: "Test Product"
   - Description: "This is a test product"
   - Category: "Electronics"
   - Price: 99.99
   - Stock: 50
   - Status: "Active"

2. **Update Product**:
   - Change price from 99.99 to 149.99
   - Update stock from 50 to 25
   - Change status to "Inactive"

3. **Delete Product**:
   - Select the test product
   - Confirm deletion
   - Verify product is removed from list

### Customers CRUD Operations
1. **Create Customer**:
   - Name: "Test Customer"
   - Email: "test@example.com"
   - Phone: "+1 555-0123"
   - Status: "Active"

2. **Search Functionality**:
   - Search by name: "John"
   - Search by email: "john.doe"
   - Verify results update correctly

### Data Persistence
Since we're using mock data, changes will:
- ✅ Persist during the session
- ❌ Reset when page refreshes
- ❌ Reset when app restarts

## 🐛 Common Issues & Solutions

### Issue: Page Not Found
- **Solution**: Check if routing is working, ensure you're on correct URL

### Issue: Data Not Loading
- **Solution**: Wait 1-2 seconds for mock data to load (simulated API delay)

### Issue: Forms Not Submitting
- **Solution**: Check all required fields are filled

### Issue: Charts Not Displaying
- **Solution**: Ensure Recharts is properly installed and data is formatted correctly

## 🔍 Browserconsole Testing
Open browser dev tools (F12) and check:
1. **Console Tab**: Look for any JavaScript errors
2. **Network Tab**: Verify no failed requests (should be minimal since using mock data)
3. **Elements Tab**: Check DOM structure if UI issues occur

## 📱 Responsive Testing
Test on different screen sizes:
1. **Desktop** (>1200px)
2. **Tablet** (768px-1200px)
3. **Mobile** (<768px)

## ✅ Success Criteria
- [ ] All pages load without errors
- [ ] Mock data displays correctly
- [ ] CRUD operations work with success messages
- [ ] Search and filter functions work
- [ ] Charts render properly
- [ ] Forms validate correctly
- [ ] Responsive design works on mobile
- [ ] Navigation between pages works

## 🚀 Next Steps (After Testing)
1. Set up GraphQL backend
2. Uncomment Apollo Provider in `main.jsx`
3. Replace mock data with real GraphQL queries
4. Add error handling for API failures
5. Implement proper data persistence

## 📞 Support
If you encounter any issues:
1. Check browserconsole for errors
2. Verify all dependencies are installed
3. Ensure you're using compatible Node.js version
4. Check this guide for troubleshooting steps
