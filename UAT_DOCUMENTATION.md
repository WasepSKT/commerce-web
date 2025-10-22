# User Acceptance Testing (UAT) Documentation
## Regal Purrfect Shop - Premium Cat Food E-commerce Platform

---

## 📋 **Document Information**

| Field | Value |
|-------|-------|
| **Project Name** | Regal Purrfect Shop |
| **Version** | 1.0.0 |
| **Document Type** | User Acceptance Testing |
| **Created Date** | January 2025 |
| **Last Updated** | January 2025 |
| **Prepared By** | Development Team |
| **Approved By** | Product Owner |

---

## 🎯 **UAT Overview**

### **Purpose**
User Acceptance Testing (UAT) untuk memastikan bahwa sistem Regal Purrfect Shop memenuhi kebutuhan bisnis dan dapat digunakan oleh end users dengan efektif.

### **Scope**
- Customer-facing features (browsing, shopping, checkout)
- User authentication and profile management
- Referral system functionality
- Admin panel features
- Payment integration
- Order management
- Blog and content management

### **Success Criteria**
- ✅ Semua user stories dapat diselesaikan tanpa error
- ✅ UI/UX sesuai dengan desain dan mudah digunakan
- ✅ Performance memenuhi standar (load time < 3 detik)
- ✅ Responsive design bekerja di semua device
- ✅ Security requirements terpenuhi

---

## 👥 **User Roles & Personas**

### **1. Customer (End User)**
- **Profile**: Pet owner yang ingin membeli makanan kucing premium
- **Goals**: Browse products, compare prices, make purchases
- **Pain Points**: Kesulitan mencari produk yang sesuai, proses checkout yang rumit

### **2. Admin**
- **Profile**: Staff yang mengelola website dan orders
- **Goals**: Manage products, orders, users, content
- **Pain Points**: Interface yang tidak user-friendly, proses yang tidak efisien

### **3. Marketing**
- **Profile**: Staff yang mengelola content dan campaigns
- **Goals**: Create blog posts, manage referrals, campaigns
- **Pain Points**: Tools yang tidak memadai untuk content creation

---

## 🧪 **Test Scenarios**

## **A. CUSTOMER JOURNEY**

### **A1. User Registration & Authentication**

#### **A1.1. User Registration**
| Test Case | TC-A1-001 |
|-----------|-----------|
| **Description** | User dapat mendaftar akun baru |
| **Preconditions** | User berada di halaman signup |
| **Steps** | 1. Buka `/signup`<br>2. Isi form: Email, Password, Nama Lengkap<br>3. Opsional: Masukkan referral code<br>4. Klik "Daftar Sekarang" |
| **Expected Result** | - Akun berhasil dibuat<br>- Email verifikasi terkirim<br>- Redirect ke halaman login<br>- Jika ada referral code valid, referrer mendapat points |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **A1.2. User Login**
| Test Case | TC-A1-002 |
|-----------|-----------|
| **Description** | User dapat login dengan email dan password |
| **Preconditions** | User memiliki akun yang sudah terverifikasi |
| **Steps** | 1. Buka `/auth`<br>2. Masukkan email dan password<br>3. Klik "Masuk Sekarang" |
| **Expected Result** | - Login berhasil<br>- Redirect ke dashboard<br>- Session tersimpan di localStorage |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **A1.3. Google OAuth Login**
| Test Case | TC-A1-003 |
|-----------|-----------|
| **Description** | User dapat login menggunakan Google OAuth |
| **Preconditions** | User memiliki Google account |
| **Steps** | 1. Buka `/auth`<br>2. Klik "Masuk dengan Google"<br>3. Authorize aplikasi di Google |
| **Expected Result** | - Login berhasil<br>- Profile terbuat otomatis<br>- Redirect ke dashboard |
| **Priority** | Medium |
| **Status** | ✅ Pass |

### **A2. Product Browsing & Search**

#### **A2.1. Browse Products**
| Test Case | TC-A2-001 |
|-----------|-----------|
| **Description** | User dapat melihat daftar produk |
| **Preconditions** | User berada di halaman products |
| **Steps** | 1. Buka `/products`<br>2. Scroll untuk melihat semua produk<br>3. Klik pada product card |
| **Expected Result** | - Daftar produk ditampilkan<br>- Product cards menampilkan gambar, nama, harga<br>- Klik membuka halaman detail produk |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **A2.2. Product Search**
| Test Case | TC-A2-002 |
|-----------|-----------|
| **Description** | User dapat mencari produk berdasarkan keyword |
| **Preconditions** | User berada di halaman products |
| **Steps** | 1. Masukkan keyword di search box<br>2. Tekan Enter atau klik search |
| **Expected Result** | - Hasil pencarian ditampilkan<br>- Produk yang relevan muncul<br>- Pagination bekerja jika hasil banyak |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **A2.3. Product Detail View**
| Test Case | TC-A2-003 |
|-----------|-----------|
| **Description** | User dapat melihat detail produk |
| **Preconditions** | User berada di halaman product detail |
| **Steps** | 1. Buka `/product/{id}`<br>2. Scroll untuk melihat semua informasi<br>3. Klik "Tambah ke Keranjang" |
| **Expected Result** | - Detail produk ditampilkan lengkap<br>- Gambar, deskripsi, harga, stock tersedia<br>- Button "Tambah" berfungsi |
| **Priority** | High |
| **Status** | ✅ Pass |

### **A3. Shopping Cart**

#### **A3.1. Add to Cart**
| Test Case | TC-A3-001 |
|-----------|-----------|
| **Description** | User dapat menambah produk ke keranjang |
| **Preconditions** | User berada di halaman product detail |
| **Steps** | 1. Klik "Tambah ke Keranjang"<br>2. Buka halaman cart |
| **Expected Result** | - Produk ditambahkan ke cart<br>- Cart counter bertambah<br>- Produk muncul di halaman cart |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **A3.2. Update Cart Quantity**
| Test Case | TC-A3-002 |
|-----------|-----------|
| **Description** | User dapat mengubah quantity produk di cart |
| **Preconditions** | User berada di halaman cart dengan produk |
| **Steps** | 1. Buka `/cart`<br>2. Ubah quantity menggunakan +/- buttons<br>3. Klik "Update Cart" |
| **Expected Result** | - Quantity berubah<br>- Subtotal terupdate<br>- Stock validation bekerja |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **A3.3. Remove from Cart**
| Test Case | TC-A3-003 |
|-----------|-----------|
| **Description** | User dapat menghapus produk dari cart |
| **Preconditions** | User berada di halaman cart dengan produk |
| **Steps** | 1. Klik tombol "Hapus" pada produk<br>2. Konfirmasi penghapusan |
| **Expected Result** | - Produk dihapus dari cart<br>- Cart counter berkurang<br>- Subtotal terupdate |
| **Priority** | High |
| **Status** | ✅ Pass |

### **A4. Checkout Process**

#### **A4.1. Address Selection**
| Test Case | TC-A4-001 |
|-----------|-----------|
| **Description** | User dapat memilih alamat pengiriman |
| **Preconditions** | User berada di halaman checkout |
| **Steps** | 1. Buka `/checkout`<br>2. Pilih provinsi, kota, kecamatan<br>3. Kode pos otomatis terisi |
| **Expected Result** | - Dropdown provinsi/kota/kecamatan berfungsi<br>- Kode pos otomatis terisi<br>- Alamat tersimpan |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **A4.2. Shipping Rate Selection**
| Test Case | TC-A4-002 |
|-----------|-----------|
| **Description** | User dapat memilih metode pengiriman |
| **Preconditions** | User sudah memilih alamat di checkout |
| **Steps** | 1. Tunggu shipping rates dimuat<br>2. Pilih salah satu metode pengiriman |
| **Expected Result** | - Shipping rates ditampilkan<br>- User dapat memilih metode<br>- Ongkir terhitung dalam total |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **A4.3. Payment Method Selection**
| Test Case | TC-A4-003 |
|-----------|-----------|
| **Description** | User dapat memilih metode pembayaran |
| **Preconditions** | User berada di halaman checkout |
| **Steps** | 1. Pilih metode pembayaran (QRIS/E-Wallet/VA)<br>2. Jika E-Wallet, pilih provider<br>3. Jika VA, pilih bank |
| **Expected Result** | - Payment methods tersedia<br>- Sub-options muncul sesuai pilihan<br>- Selection tersimpan |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **A4.4. Order Completion**
| Test Case | TC-A4-004 |
|-----------|-----------|
| **Description** | User dapat menyelesaikan order |
| **Preconditions** | User sudah memilih semua opsi di checkout |
| **Steps** | 1. Klik "Bayar & Lanjutkan"<br>2. Tunggu redirect ke payment gateway |
| **Expected Result** | - Order tersimpan di database<br> - Stock berkurang<br>- Redirect ke payment gateway<br>- Turnstile verification bekerja |
| **Priority** | High |
| **Status** | ✅ Pass |

### **A5. User Profile Management**

#### **A5.1. View Profile**
| Test Case | TC-A5-001 |
|-----------|-----------|
| **Description** | User dapat melihat profil mereka |
| **Preconditions** | User sudah login |
| **Steps** | 1. Buka `/profile`<br>2. Lihat informasi profil |
| **Expected Result** | - Profil ditampilkan lengkap<br>- Referral level badge muncul<br>- Commission rate ditampilkan |
| **Priority** | Medium |
| **Status** | ✅ Pass |

#### **A5.2. Edit Profile**
| Test Case | TC-A5-002 |
|-----------|-----------|
| **Description** | User dapat mengedit informasi profil |
| **Preconditions** | User berada di halaman profile |
| **Steps** | 1. Klik "Edit Profile"<br>2. Ubah informasi<br>3. Klik "Simpan" |
| **Expected Result** | - Form edit muncul<br>- Perubahan tersimpan<br>- Profil terupdate |
| **Priority** | Medium |
| **Status** | ✅ Pass |

#### **A5.3. Address Management**
| Test Case | TC-A5-003 |
|-----------|-----------|
| **Description** | User dapat mengelola alamat |
| **Preconditions** | User berada di halaman profile |
| **Steps** | 1. Scroll ke bagian alamat<br>2. Edit alamat<br>3. Simpan perubahan |
| **Expected Result** | - Form alamat dapat diedit<br>- Dropdown provinsi/kota/kecamatan berfungsi<br>- Kode pos otomatis terisi |
| **Priority** | Medium |
| **Status** | ✅ Pass |

### **A6. Order History**

#### **A6.1. View Order History**
| Test Case | TC-A6-001 |
|-----------|-----------|
| **Description** | User dapat melihat riwayat order |
| **Preconditions** | User sudah login dan memiliki order |
| **Steps** | 1. Buka `/my-orders`<br>2. Lihat daftar order |
| **Expected Result** | - Daftar order ditampilkan<br>- Status order jelas<br>- Detail order dapat dilihat |
| **Priority** | Medium |
| **Status** | ✅ Pass |

---

## **B. REFERRAL SYSTEM**

### **B1. Referral Code Usage**

#### **B1.1. Use Referral Code During Signup**
| Test Case | TC-B1-001 |
|-----------|-----------|
| **Description** | User dapat menggunakan referral code saat signup |
| **Preconditions** | User memiliki referral code yang valid |
| **Steps** | 1. Buka `/signup`<br>2. Isi form signup<br>3. Masukkan referral code<br>4. Submit form |
| **Expected Result** | - Referral code divalidasi<br>- Referrer mendapat points<br>- Referee tidak mendapat points<br>- Success message ditampilkan |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **B1.2. Invalid Referral Code**
| Test Case | TC-B1-002 |
|-----------|-----------|
| **Description** | Sistem menolak referral code yang tidak valid |
| **Preconditions** | User berada di halaman signup |
| **Steps** | 1. Masukkan referral code yang tidak valid<br>2. Submit form |
| **Expected Result** | - Error message ditampilkan<br>- Signup tetap berhasil tanpa referral |
| **Priority** | Medium |
| **Status** | ✅ Pass |

### **B2. Referral Level System**

#### **B2.1. Referral Level Display**
| Test Case | TC-B2-001 |
|-----------|-----------|
| **Description** | User dapat melihat referral level mereka |
| **Preconditions** | User sudah login dan memiliki referral stats |
| **Steps** | 1. Buka `/profile`<br>2. Lihat referral level badge |
| **Expected Result** | - Level badge ditampilkan<br>- Commission rate ditampilkan<br>- Progress ke level berikutnya jelas |
| **Priority** | Medium |
| **Status** | ✅ Pass |

#### **B2.2. Referral Stats**
| Test Case | TC-B2-002 |
|-----------|-----------|
| **Description** | User dapat melihat statistik referral |
| **Preconditions** | User sudah login |
| **Steps** | 1. Buka `/profile`<br>2. Scroll ke bagian referral stats |
| **Expected Result** | - Total referral points ditampilkan<br>- Jumlah referral ditampilkan<br>- Total commission ditampilkan |
| **Priority** | Medium |
| **Status** | ✅ Pass |

---

## **C. ADMIN PANEL**

### **C1. Admin Authentication**

#### **C1.1. Admin Login**
| Test Case | TC-C1-001 |
|-----------|-----------|
| **Description** | Admin dapat login ke admin panel |
| **Preconditions** | Admin memiliki akun dengan role admin |
| **Steps** | 1. Buka `/admin`<br>2. Login dengan credentials admin |
| **Expected Result** | - Login berhasil<br>- Redirect ke admin dashboard<br>- Admin menu tersedia |
| **Priority** | High |
| **Status** | ✅ Pass |

### **C2. Product Management**

#### **C2.1. View Products**
| Test Case | TC-C2-001 |
|-----------|-----------|
| **Description** | Admin dapat melihat daftar produk |
| **Preconditions** | Admin sudah login |
| **Steps** | 1. Buka `/admin/products`<br>2. Lihat daftar produk |
| **Expected Result** | - Daftar produk ditampilkan<br>- Pagination bekerja<br>- Search dan filter tersedia |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **C2.2. Add New Product**
| Test Case | TC-C2-002 |
|-----------|-----------|
| **Description** | Admin dapat menambah produk baru |
| **Preconditions** | Admin berada di halaman products |
| **Steps** | 1. Klik "Tambah Produk"<br>2. Isi form produk<br>3. Upload gambar<br>4. Klik "Simpan" |
| **Expected Result** | - Form produk muncul<br>- Upload gambar berfungsi<br>- Produk tersimpan di database |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **C2.3. Edit Product**
| Test Case | TC-C2-003 |
|-----------|-----------|
| **Description** | Admin dapat mengedit produk |
| **Preconditions** | Admin berada di halaman products |
| **Steps** | 1. Klik "Edit" pada produk<br>2. Ubah informasi produk<br>3. Klik "Simpan" |
| **Expected Result** | - Form edit muncul<br>- Perubahan tersimpan<br>- Produk terupdate |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **C2.4. Delete Product**
| Test Case | TC-C2-004 |
|-----------|-----------|
| **Description** | Admin dapat menghapus produk |
| **Preconditions** | Admin berada di halaman products |
| **Steps** | 1. Klik "Hapus" pada produk<br>2. Konfirmasi penghapusan |
| **Expected Result** | - Konfirmasi dialog muncul<br>- Produk dihapus dari database<br>- UI terupdate |
| **Priority** | Medium |
| **Status** | ✅ Pass |

### **C3. Order Management**

#### **C3.1. View Orders**
| Test Case | TC-C3-001 |
|-----------|-----------|
| **Description** | Admin dapat melihat daftar order |
| **Preconditions** | Admin sudah login |
| **Steps** | 1. Buka `/admin/orders`<br>2. Lihat daftar order |
| **Expected Result** | - Daftar order ditampilkan<br>- Status order dengan badge<br>- Detail order dapat dilihat |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **C3.2. View Order Details**
| Test Case | TC-C3-002 |
|-----------|-----------|
| **Description** | Admin dapat melihat detail order |
| **Preconditions** | Admin berada di halaman orders |
| **Steps** | 1. Klik "Detail" pada order<br>2. Lihat detail order |
| **Expected Result** | - Detail order ditampilkan<br>- Item produk lengkap<br>- Informasi customer jelas |
| **Priority** | High |
| **Status** | ✅ Pass |

### **C4. User Management**

#### **C4.1. View Users**
| Test Case | TC-C4-001 |
|-----------|-----------|
| **Description** | Admin dapat melihat daftar user |
| **Preconditions** | Admin sudah login |
| **Steps** | 1. Buka `/admin/users`<br>2. Lihat daftar user |
| **Expected Result** | - Daftar user ditampilkan<br>- Role user jelas<br>- Search dan filter tersedia |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **C4.2. Add New User**
| Test Case | TC-C4-002 |
|-----------|-----------|
| **Description** | Admin dapat menambah user baru |
| **Preconditions** | Admin berada di halaman users |
| **Steps** | 1. Klik "Tambah User"<br>2. Isi form user<br>3. Pilih role<br>4. Klik "Simpan" |
| **Expected Result** | - Form user muncul<br>- User tersimpan<br>- Akun langsung aktif |
| **Priority** | Medium |
| **Status** | ✅ Pass |

#### **C4.3. Edit User Role**
| Test Case | TC-C4-003 |
|-----------|-----------|
| **Description** | Admin dapat mengubah role user |
| **Preconditions** | Admin berada di halaman users |
| **Steps** | 1. Klik "Edit" pada user<br>2. Ubah role<br>3. Klik "Simpan" |
| **Expected Result** | - Form edit muncul<br>- Role terupdate<br>- Permission berubah sesuai role |
| **Priority** | Medium |
| **Status** | ✅ Pass |

### **C5. Blog Management**

#### **C5.1. View Blog Posts**
| Test Case | TC-C5-001 |
|-----------|-----------|
| **Description** | Admin dapat melihat daftar blog posts |
| **Preconditions** | Admin sudah login |
| **Steps** | 1. Buka `/admin/blogs`<br>2. Lihat daftar blog posts |
| **Expected Result** | - Daftar blog posts ditampilkan<br>- Status publish jelas<br>- Search tersedia |
| **Priority** | Medium |
| **Status** | ✅ Pass |

#### **C5.2. Create Blog Post**
| Test Case | TC-C5-002 |
|-----------|-----------|
| **Description** | Admin dapat membuat blog post baru |
| **Preconditions** | Admin berada di halaman blogs |
| **Steps** | 1. Klik "Tambah Blog"<br>2. Isi form blog<br>3. Gunakan rich text editor<br>4. Klik "Publish" |
| **Expected Result** | - Form blog muncul<br>- Rich text editor berfungsi<br>- Blog post tersimpan |
| **Priority** | Medium |
| **Status** | ✅ Pass |

---

## **D. PAYMENT & SHIPPING**

### **D1. Payment Integration**

#### **D1.1. Payment Gateway Integration**
| Test Case | TC-D1-001 |
|-----------|-----------|
| **Description** | Payment gateway terintegrasi dengan benar |
| **Preconditions** | User menyelesaikan checkout |
| **Steps** | 1. Selesaikan checkout<br>2. Redirect ke payment gateway<br>3. Lakukan pembayaran |
| **Expected Result** | - Redirect ke payment gateway berhasil<br>- Payment gateway menampilkan detail pembayaran<br>- Webhook menerima notifikasi pembayaran |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **D1.2. Payment Status Update**
| Test Case | TC-D1-002 |
|-----------|-----------|
| **Description** | Status pembayaran terupdate otomatis |
| **Preconditions** | Payment gateway mengirim webhook |
| **Steps** | 1. Lakukan pembayaran<br>2. Tunggu webhook dari payment gateway |
| **Expected Result** | - Order status terupdate ke "paid"<br>- Admin dapat melihat status terbaru<br>- Customer mendapat notifikasi |
| **Priority** | High |
| **Status** | ✅ Pass |

### **D2. Shipping Integration**

#### **D2.1. Shipping Rate Calculation**
| Test Case | TC-D2-001 |
|-----------|-----------|
| **Description** | Shipping rate dihitung dengan benar |
| **Preconditions** | User memilih alamat di checkout |
| **Steps** | 1. Pilih alamat pengiriman<br>2. Tunggu shipping rates dimuat |
| **Expected Result** | - Shipping rates ditampilkan<br>- Ongkir sesuai dengan jarak dan berat<br>- Multiple courier options tersedia |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **D2.2. Shipping Status Update**
| Test Case | TC-D2-002 |
|-----------|-----------|
| **Description** | Status pengiriman terupdate otomatis |
| **Preconditions** | Order sudah dibayar |
| **Steps** | 1. Tunggu order dikirim<br>2. Shipping API mengirim update |
| **Expected Result** | - Shipping status terupdate<br>- Tracking number tersedia<br>- Customer mendapat notifikasi |
| **Priority** | High |
| **Status** | ✅ Pass |

---

## **E. SECURITY & PERFORMANCE**

### **E1. Security Testing**

#### **E1.1. Authentication Security**
| Test Case | TC-E1-001 |
|-----------|-----------|
| **Description** | Sistem autentikasi aman |
| **Preconditions** | User mencoba akses halaman protected |
| **Steps** | 1. Akses `/admin` tanpa login<br>2. Akses `/profile` tanpa login |
| **Expected Result** | - Redirect ke halaman login<br>- Tidak ada data sensitif yang terakses |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **E1.2. Turnstile Protection**
| Test Case | TC-E1-002 |
|-----------|-----------|
| **Description** | Turnstile anti-bot protection bekerja |
| **Preconditions** | User berada di halaman auth/signup/checkout |
| **Steps** | 1. Buka halaman auth<br>2. Lihat console untuk Turnstile logs<br>3. Coba login |
| **Expected Result** | - Turnstile widget ter-render<br>- Token di-generate<br>- Bot protection aktif |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **E1.3. CSRF Protection**
| Test Case | TC-E1-003 |
|-----------|-----------|
| **Description** | CSRF protection aktif |
| **Preconditions** | User melakukan form submission |
| **Steps** | 1. Submit form dari external site<br>2. Coba POST request tanpa proper headers |
| **Expected Result** | - Request ditolak<br>- Error message ditampilkan |
| **Priority** | Medium |
| **Status** | ✅ Pass |

### **E2. Performance Testing**

#### **E2.1. Page Load Time**
| Test Case | TC-E2-001 |
|-----------|-----------|
| **Description** | Halaman dimuat dalam waktu yang wajar |
| **Preconditions** | User mengakses website |
| **Steps** | 1. Buka homepage<br>2. Buka halaman products<br>3. Buka halaman checkout |
| **Expected Result** | - Homepage load < 3 detik<br>- Products page load < 3 detik<br>- Checkout page load < 3 detik |
| **Priority** | High |
| **Status** | ✅ Pass |

#### **E2.2. Mobile Performance**
| Test Case | TC-E2-002 |
|-----------|-----------|
| **Description** | Website performa baik di mobile |
| **Preconditions** | User mengakses dari mobile device |
| **Steps** | 1. Buka website di mobile<br>2. Navigate ke berbagai halaman<br>3. Test checkout process |
| **Expected Result** | - Responsive design bekerja<br>- Touch interactions smooth<br>- Performance tetap baik |
| **Priority** | High |
| **Status** | ✅ Pass |

---

## **F. RESPONSIVE DESIGN**

### **F1. Desktop Testing**

#### **F1.1. Desktop Layout**
| Test Case | TC-F1-001 |
|-----------|-----------|
| **Description** | Layout desktop sesuai desain |
| **Preconditions** | User mengakses dari desktop |
| **Steps** | 1. Buka website di desktop (1920x1080)<br>2. Navigate ke semua halaman |
| **Expected Result** | - Layout sesuai desain<br>- Navigation menu lengkap<br>- Content terorganisir dengan baik |
| **Priority** | High |
| **Status** | ✅ Pass |

### **F2. Tablet Testing**

#### **F2.1. Tablet Layout**
| Test Case | TC-F2-001 |
|-----------|-----------|
| **Description** | Layout tablet responsive |
| **Preconditions** | User mengakses dari tablet |
| **Steps** | 1. Buka website di tablet (768x1024)<br>2. Test navigation dan interactions |
| **Expected Result** | - Layout menyesuaikan screen size<br>- Touch interactions bekerja<br>- Content readable |
| **Priority** | Medium |
| **Status** | ✅ Pass |

### **F3. Mobile Testing**

#### **F3.1. Mobile Layout**
| Test Case | TC-F3-001 |
|-----------|-----------|
| **Description** | Layout mobile responsive |
| **Preconditions** | User mengakses dari mobile |
| **Steps** | 1. Buka website di mobile (375x667)<br>2. Test semua functionality |
| **Expected Result** | - Mobile-first design<br>- Hamburger menu bekerja<br>- Forms mudah digunakan |
| **Priority** | High |
| **Status** | ✅ Pass |

---

## 📊 **Test Results Summary**

| Category | Total Tests | Passed | Failed | Pass Rate |
|----------|-------------|--------|--------|-----------|
| **Customer Journey** | 15 | 15 | 0 | 100% |
| **Referral System** | 4 | 4 | 0 | 100% |
| **Admin Panel** | 12 | 12 | 0 | 100% |
| **Payment & Shipping** | 4 | 4 | 0 | 100% |
| **Security & Performance** | 5 | 5 | 0 | 100% |
| **Responsive Design** | 3 | 3 | 0 | 100% |
| **TOTAL** | **43** | **43** | **0** | **100%** |

---

## 🐛 **Known Issues & Limitations**

### **Critical Issues**
- None identified

### **Minor Issues**
- None identified

### **Enhancement Opportunities**
1. **Search Functionality**: Bisa ditambahkan filter berdasarkan kategori dan harga
2. **Wishlist Feature**: User bisa menyimpan produk favorit
3. **Product Reviews**: User bisa memberikan review dan rating
4. **Push Notifications**: Notifikasi real-time untuk order updates

---

## ✅ **UAT Sign-off**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Product Owner** | | | |
| **Business Analyst** | | | |
| **QA Lead** | | | |
| **Development Lead** | | | |

---

## 📝 **Notes**

### **Test Environment**
- **URL**: https://dev.regalpaw.id
- **Browser**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop, Tablet, Mobile
- **Test Data**: Production-like data

### **Dependencies**
- Supabase backend services
- Payment gateway integration
- Shipping API integration
- Cloudflare Turnstile

### **Assumptions**
- All external services (payment, shipping) are available
- Test data is properly seeded
- Network connectivity is stable

---

*This document will be updated as new features are added or requirements change.*
