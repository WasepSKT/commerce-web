export const CHECKOUT_MESSAGES = {
  PAGE_TITLE: 'Checkout - Regal Paw',
  PAGE_DESC: 'Pilih alamat, jasa pengiriman, dan metode pembayaran.',
  ADDRESS_TITLE: 'Alamat Pengiriman',
  EDIT: 'Edit',
  SAVE_TO_PROFILE: 'Simpan ke Profil',
  CANCEL: 'Batal',
  SHIPPING_TITLE: 'Pilih Jasa Pengiriman',
  LOADING_RATES: 'Memuat tarif...',
  ORDER_SUMMARY: 'Ringkasan Pesanan',
  PAYMENT_METHOD: 'Metode Pembayaran',
  EWALLET_LABEL: 'Pilih Dompet Digital',
  VA_LABEL: 'Pilih Bank (VA)',
  SUBTOTAL: 'Subtotal',
  SHIPPING_FEE: 'Ongkos Kirim',
  TOTAL: 'Total',
  PAY_AND_CONTINUE: 'Bayar & Lanjutkan',
  USING_TEMP_RATES: 'Menggunakan tarif pengiriman sementara',
  USING_TEMP_RATES_DESC: 'Gagal memuat tarif resmi — menampilkan opsi sementara.',
  LIMITED_SHIPPING: 'Opsi pengiriman terbatas',
  LIMITED_SHIPPING_DESC: 'Produk ini memiliki layanan pengiriman terbatas; menampilkan opsi terdekat.',
  SESSION_CREATED: 'Sesi pembayaran dibuat',
  SESSION_DESC: 'Lanjutkan ke penyedia pembayaran.',
  SESSION_TEST_CREATED: 'Sesi pembayaran (uji) dibuat',
  SESSION_TEST_DESC: 'Ini adalah mode uji — tidak ada data yang disimpan.',
  PROFILE_SAVE_SUCCESS: 'Berhasil',
  PROFILE_SAVE_SUCCESS_DESC: 'Alamat pengiriman disimpan ke profil.',
  PROFILE_SAVE_FAIL: 'Gagal menyimpan alamat',
  PROFILE_UPDATE_UNAVAILABLE: 'Tidak dapat menyimpan',
  PROFILE_UPDATE_UNAVAILABLE_DESC: 'Fungsi pembaruan profil tidak tersedia.',
  RATES_LOAD_FAIL: 'Gagal memuat tarif pengiriman',
  CHECKOUT_LOAD_FAIL: 'Gagal memuat checkout',
  CART_LOAD_FAIL: 'Gagal memuat keranjang',
  TURNSTILE_TOKEN_FAIL: 'Gagal mendapatkan token perlindungan (Turnstile). Coba lagi.',
  PAYMENT_START_FAIL: 'Gagal memulai pembayaran',
} as const;

export const PAYMENT_METHODS = [
  { id: 'QRIS', name: 'QRIS', description: 'Pembayaran QRIS melalui aplikasi bank/dompet digital' },
  { id: 'EWALLET', name: 'E-Wallet', description: 'Dompet digital (OVO, GoPay, Dana) sesuai ketersediaan' },
  { id: 'VIRTUAL_ACCOUNT', name: 'Virtual Account', description: 'Transfer bank via Virtual Account (BRI, BCA, BNI, Mandiri, etc.)' },
 ] as const;

export const EWALLETS = ['OVO', 'GOPAY', 'DANA'] as const;
export const BANKS = ['BCA', 'BNI', 'BRI', 'MANDIRI'] as const;


