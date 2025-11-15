# Test Data Requirements & Environment Setup

## Regal Purrfect Shop - Testing Documentation

---

## 📋 **Document Information**

| Field             | Value                         |
| ----------------- | ----------------------------- |
| **Project Name**  | Regal Purrfect Shop           |
| **Version**       | 1.0.0                         |
| **Document Type** | Test Data & Environment Setup |
| **Created Date**  | January 2025                  |
| **Last Updated**  | January 2025                  |
| **Prepared By**   | QA Team                       |
| **Approved By**   | Technical Lead                |

---

## 🎯 **Overview**

Dokumen ini berisi panduan lengkap untuk menyiapkan environment testing dan data test yang diperlukan untuk menjalankan UAT dan SIT pada sistem Regalpaw.

---

## 🏗️ **Environment Setup**

### **A. Development Environment**

#### **A1. Local Development Setup**

```bash
# 1. Clone Repository
git clone https://github.com/Fakihibrohim-SKT/regal-purrfect-shop.git
cd regal-purrfect-shop

# 2. Install Dependencies
npm install

# 3. Environment Configuration
cp .env.example .env
# Edit .env file with your credentials

# 4. Start Development Server
npm run dev
```

#### **A2. Environment Variables**

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Turnstile Configuration
VITE_TURNSTILE_SITEKEY=your_turnstile_sitekey
TURNSTILE_SECRET=your_turnstile_secret

# Payment Gateway (Xendit)
XENDIT_SECRET_KEY=your_xendit_secret_key
XENDIT_WEBHOOK_TOKEN=your_xendit_webhook_token

# Shipping API (RajaOngkir)
RAJAONGKIR_API_KEY=your_rajaongkir_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### **B. Testing Environment**

#### **B1. Staging Environment**

- **URL**: https://staging.regalpaw.id
- **Database**: Supabase Staging Project
- **External APIs**: Sandbox/Test Mode
- **Monitoring**: Development Tools

#### **B2. Production Environment**

- **URL**: https://dev.regalpaw.id
- **Database**: Supabase Production Project
- **External APIs**: Live Mode
- **Monitoring**: Production Monitoring Tools

---

## 📊 **Test Data Requirements**

### **A. User Data**

#### **A1. Customer Users**

```sql
-- Test Customer Users
INSERT INTO profiles (user_id, email, full_name, role, referral_code) VALUES
('test-customer-1', 'customer1@test.com', 'John Doe', 'customer', 'CUST001'),
('test-customer-2', 'customer2@test.com', 'Jane Smith', 'customer', 'CUST002'),
('test-customer-3', 'customer3@test.com', 'Bob Johnson', 'customer', 'CUST003'),
('test-customer-4', 'customer4@test.com', 'Alice Brown', 'customer', 'CUST004'),
('test-customer-5', 'customer5@test.com', 'Charlie Wilson', 'customer', 'CUST005');
```

#### **A2. Admin Users**

```sql
-- Test Admin Users
INSERT INTO profiles (user_id, email, full_name, role, referral_code) VALUES
('test-admin-1', 'admin1@test.com', 'Admin User', 'admin', 'ADMIN001'),
('test-marketing-1', 'marketing1@test.com', 'Marketing User', 'marketing', 'MKT001'),
('test-sales-1', 'sales1@test.com', 'Sales User', 'admin_sales', 'SALES001');
```

#### **A3. Referral Test Data**

```sql
-- Referral Relationships
INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_points, status) VALUES
('test-customer-1', 'test-customer-2', 'CUST001', 100, 'active'),
('test-customer-1', 'test-customer-3', 'CUST001', 100, 'active'),
('test-customer-2', 'test-customer-4', 'CUST002', 100, 'active');
```

### **B. Product Data**

#### **B1. Categories**

```sql
-- Product Categories
INSERT INTO categories (name, description, slug) VALUES
('Dry Food', 'Premium dry cat food', 'dry-food'),
('Wet Food', 'High-quality wet cat food', 'wet-food'),
('Treats', 'Cat treats and snacks', 'treats'),
('Supplements', 'Cat health supplements', 'supplements'),
('Toys', 'Cat toys and entertainment', 'toys');
```

#### **B2. Products**

```sql
-- Test Products
INSERT INTO products (name, description, price, category_id, stock_quantity, image_url) VALUES
('Royal Canin Adult', 'Premium dry food for adult cats', 150000, 1, 100, '/images/royal-canin.jpg'),
('Whiskas Wet Food', 'Delicious wet food variety pack', 25000, 2, 200, '/images/whiskas.jpg'),
('Felix Treats', 'Irresistible cat treats', 15000, 3, 150, '/images/felix-treats.jpg'),
('Catnip Supplement', 'Natural catnip supplement', 35000, 4, 75, '/images/catnip.jpg'),
('Interactive Mouse Toy', 'Fun interactive toy for cats', 45000, 5, 50, '/images/mouse-toy.jpg');
```

### **C. Order Data**

#### **C1. Test Orders**

```sql
-- Test Orders
INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method) VALUES
('test-customer-1', 175000, 'pending', '{"name":"John Doe","phone":"08123456789","address":"Jl. Test No. 1","city":"Jakarta","postal_code":"12345"}', 'QRIS'),
('test-customer-2', 40000, 'paid', '{"name":"Jane Smith","phone":"08123456790","address":"Jl. Test No. 2","city":"Bandung","postal_code":"54321"}', 'EWALLET'),
('test-customer-3', 60000, 'shipped', '{"name":"Bob Johnson","phone":"08123456791","address":"Jl. Test No. 3","city":"Surabaya","postal_code":"67890"}', 'VIRTUAL_ACCOUNT');
```

#### **C2. Order Items**

```sql
-- Test Order Items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 150000),
(1, 2, 1, 25000),
(2, 3, 2, 30000),
(2, 4, 1, 10000),
(3, 5, 1, 45000),
(3, 1, 1, 15000);
```

### **D. Blog Data**

#### **D1. Blog Categories**

```sql
-- Blog Categories
INSERT INTO blog_categories (name, description, slug) VALUES
('Cat Care', 'Tips and advice for cat care', 'cat-care'),
('Nutrition', 'Cat nutrition and feeding guides', 'nutrition'),
('Health', 'Cat health and wellness', 'health'),
('Behavior', 'Understanding cat behavior', 'behavior'),
('Products', 'Product reviews and recommendations', 'products');
```

#### **D2. Blog Posts**

```sql
-- Test Blog Posts
INSERT INTO blogs (title, content, excerpt, author_id, status, featured_image) VALUES
('Complete Guide to Cat Nutrition', '<p>Comprehensive guide to feeding your cat...</p>', 'Learn everything about cat nutrition', 'test-admin-1', 'published', '/images/cat-nutrition.jpg'),
('Understanding Cat Behavior', '<p>Decode your cat behavior...</p>', 'Understand why cats do what they do', 'test-marketing-1', 'published', '/images/cat-behavior.jpg'),
('Best Cat Toys for 2025', '<p>Top-rated cat toys...</p>', 'Discover the best toys for your cat', 'test-marketing-1', 'draft', '/images/cat-toys.jpg');
```

---

## 🧪 **Test Scenarios Data**

### **A. Authentication Test Data**

#### **A1. Valid Credentials**

```json
{
  "validUsers": [
    {
      "email": "customer1@test.com",
      "password": "TestPassword123!",
      "role": "customer"
    },
    {
      "email": "admin1@test.com",
      "password": "AdminPassword123!",
      "role": "admin"
    }
  ]
}
```

#### **A2. Invalid Credentials**

```json
{
  "invalidUsers": [
    {
      "email": "invalid@test.com",
      "password": "WrongPassword123!",
      "expectedError": "Invalid credentials"
    },
    {
      "email": "customer1@test.com",
      "password": "wrongpassword",
      "expectedError": "Invalid credentials"
    }
  ]
}
```

### **B. E-commerce Test Data**

#### **B1. Shopping Cart Scenarios**

```json
{
  "cartScenarios": [
    {
      "scenario": "Add single product",
      "productId": 1,
      "quantity": 1,
      "expectedSubtotal": 150000
    },
    {
      "scenario": "Add multiple products",
      "products": [
        { "id": 1, "quantity": 2 },
        { "id": 2, "quantity": 1 }
      ],
      "expectedSubtotal": 325000
    },
    {
      "scenario": "Update quantity",
      "productId": 1,
      "newQuantity": 3,
      "expectedSubtotal": 450000
    }
  ]
}
```

#### **B2. Checkout Scenarios**

```json
{
  "checkoutScenarios": [
    {
      "scenario": "Complete checkout",
      "address": {
        "name": "Test User",
        "phone": "08123456789",
        "address": "Jl. Test No. 1",
        "city": "Jakarta",
        "postal_code": "12345"
      },
      "paymentMethod": "QRIS",
      "expectedResult": "Order created successfully"
    },
    {
      "scenario": "Invalid address",
      "address": {
        "name": "",
        "phone": "08123456789",
        "address": "Jl. Test No. 1",
        "city": "Jakarta",
        "postal_code": "12345"
      },
      "expectedResult": "Validation error"
    }
  ]
}
```

### **C. Referral Test Data**

#### **C1. Referral Scenarios**

```json
{
  "referralScenarios": [
    {
      "scenario": "Valid referral code",
      "referralCode": "CUST001",
      "newUserEmail": "newuser@test.com",
      "expectedResult": "Referral processed, referrer gets points"
    },
    {
      "scenario": "Invalid referral code",
      "referralCode": "INVALID123",
      "expectedResult": "Referral code not found"
    },
    {
      "scenario": "Self-referral",
      "referralCode": "CUST001",
      "newUserEmail": "customer1@test.com",
      "expectedResult": "Cannot refer yourself"
    }
  ]
}
```

---

## 🔧 **Database Setup Scripts**

### **A. Complete Test Data Setup**

```sql
-- 1. Clear existing test data
DELETE FROM referrals WHERE referrer_id LIKE 'test-%';
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id LIKE 'test-%');
DELETE FROM orders WHERE user_id LIKE 'test-%';
DELETE FROM profiles WHERE user_id LIKE 'test-%';

-- 2. Insert test users
INSERT INTO profiles (user_id, email, full_name, role, referral_code) VALUES
('test-customer-1', 'customer1@test.com', 'John Doe', 'customer', 'CUST001'),
('test-customer-2', 'customer2@test.com', 'Jane Smith', 'customer', 'CUST002'),
('test-customer-3', 'customer3@test.com', 'Bob Johnson', 'customer', 'CUST003'),
('test-admin-1', 'admin1@test.com', 'Admin User', 'admin', 'ADMIN001'),
('test-marketing-1', 'marketing1@test.com', 'Marketing User', 'marketing', 'MKT001');

-- 3. Insert test products
INSERT INTO products (name, description, price, category_id, stock_quantity, image_url) VALUES
('Royal Canin Adult', 'Premium dry food for adult cats', 150000, 1, 100, '/images/royal-canin.jpg'),
('Whiskas Wet Food', 'Delicious wet food variety pack', 25000, 2, 200, '/images/whiskas.jpg'),
('Felix Treats', 'Irresistible cat treats', 15000, 3, 150, '/images/felix-treats.jpg');

-- 4. Insert test orders
INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method) VALUES
('test-customer-1', 175000, 'pending', '{"name":"John Doe","phone":"08123456789","address":"Jl. Test No. 1","city":"Jakarta","postal_code":"12345"}', 'QRIS'),
('test-customer-2', 40000, 'paid', '{"name":"Jane Smith","phone":"08123456790","address":"Jl. Test No. 2","city":"Bandung","postal_code":"54321"}', 'EWALLET');

-- 5. Insert test order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 150000),
(1, 2, 1, 25000),
(2, 3, 2, 30000),
(2, 4, 1, 10000);
```

### **B. Referral Level Setup**

```sql
-- Insert referral levels
INSERT INTO referral_levels (name, min_amount, commission_pct, description) VALUES
('Bronze', 0, 5, 'Bronze level - 5% commission'),
('Silver', 1000000, 7, 'Silver level - 7% commission'),
('Gold', 5000000, 10, 'Gold level - 10% commission'),
('Platinum', 10000000, 15, 'Platinum level - 15% commission');
```

---

## 🚀 **Testing Workflow**

### **A. Pre-Test Setup**

1. **Environment Setup**

   - Clone repository
   - Install dependencies
   - Configure environment variables
   - Start development server

2. **Database Setup**

   - Run database migrations
   - Insert test data
   - Verify data integrity

3. **External Services Setup**
   - Configure payment gateway (sandbox)
   - Configure shipping API (test mode)
   - Configure Turnstile (test sitekey)

### **B. Test Execution**

1. **UAT Execution**

   - Execute user journey tests
   - Verify business requirements
   - Document test results

2. **SIT Execution**

   - Execute integration tests
   - Verify system interactions
   - Document integration results

3. **Performance Testing**
   - Execute performance tests
   - Monitor system metrics
   - Document performance results

### **C. Post-Test Cleanup**

1. **Data Cleanup**

   - Remove test data
   - Reset database state
   - Clear caches

2. **Environment Cleanup**
   - Stop services
   - Clear logs
   - Reset configurations

---

## 📊 **Test Data Validation**

### **A. Data Integrity Checks**

```sql
-- Check user data integrity
SELECT COUNT(*) as user_count FROM profiles WHERE user_id LIKE 'test-%';

-- Check product data integrity
SELECT COUNT(*) as product_count FROM products WHERE name LIKE '%Test%';

-- Check order data integrity
SELECT COUNT(*) as order_count FROM orders WHERE user_id LIKE 'test-%';

-- Check referral data integrity
SELECT COUNT(*) as referral_count FROM referrals WHERE referrer_id LIKE 'test-%';
```

### **B. Business Logic Validation**

```sql
-- Check referral level calculations
SELECT
  p.full_name,
  rl.name as level_name,
  rl.commission_pct,
  COALESCE(SUM(o.total_amount), 0) as total_amount
FROM profiles p
LEFT JOIN referrals r ON p.id = r.referrer_id
LEFT JOIN orders o ON r.referred_id = o.user_id
LEFT JOIN referral_levels rl ON COALESCE(SUM(o.total_amount), 0) >= rl.min_amount
WHERE p.user_id LIKE 'test-%'
GROUP BY p.id, p.full_name, rl.name, rl.commission_pct;
```

---

## 🔍 **Troubleshooting**

### **A. Common Issues**

#### **A1. Database Connection Issues**

```bash
# Check Supabase connection
curl -H "apikey: YOUR_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
     https://YOUR_SUPABASE_URL/rest/v1/profiles
```

#### **A2. Environment Variable Issues**

```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_PUBLISHABLE_KEY
echo $VITE_TURNSTILE_SITEKEY
```

#### **A3. External API Issues**

```bash
# Test payment gateway connection
curl -X POST https://api.xendit.co/v2/invoices \
     -H "Authorization: Basic YOUR_XENDIT_SECRET_KEY" \
     -H "Content-Type: application/json" \
     -d '{"external_id":"test","amount":10000}'
```

### **B. Debug Commands**

```bash
# Check application logs
npm run dev 2>&1 | tee app.log

# Check database logs
# (Check Supabase Dashboard logs)

# Check network requests
# (Use browser DevTools Network tab)
```

---

## 📝 **Test Data Maintenance**

### **A. Regular Cleanup**

- **Daily**: Remove old test orders and sessions
- **Weekly**: Clean up test user accounts
- **Monthly**: Refresh product test data

### **B. Data Refresh**

- **Before major testing**: Run complete test data setup
- **After testing**: Clean up test data
- **For specific tests**: Create targeted test data

### **C. Data Backup**

- **Before testing**: Backup production data
- **After testing**: Restore production data
- **For rollback**: Keep test data snapshots

---

## ✅ **Sign-off**

| Role                | Name | Signature | Date |
| ------------------- | ---- | --------- | ---- |
| **QA Lead**         |      |           |      |
| **Database Admin**  |      |           |      |
| **DevOps Engineer** |      |           |      |
| **Technical Lead**  |      |           |      |

---

_This document will be updated as new test scenarios are added or existing ones are modified._
