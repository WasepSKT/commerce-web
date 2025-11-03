/**
 * Constants for cart page
 */

export const CART_MESSAGES = {
  CLEARED: 'Keranjang dibersihkan',
  CLEARED_DESC: 'Data keranjang yang rusak telah dihapus.',
  CART_EMPTY: 'Keranjang kosong',
  CART_EMPTY_DESC: 'Tambahkan produk terlebih dahulu.',
  CLEAR_SUCCESS: 'Keranjang dibersihkan',
  ITEM_REMOVED: 'Produk dihapus',
  LOAD_ERROR: 'Gagal memuat keranjang',
  LOAD_ERROR_DESC: 'Terjadi kesalahan saat mengambil data produk.',
  STOCK_INSUFFICIENT: 'Stok tidak mencukupi',
  STOCK_INSUFFICIENT_DESC: 'Beberapa produk tidak memiliki stok yang cukup. Silakan periksa keranjang Anda.',
  LOGIN_REQUIRED: 'Harap masuk terlebih dahulu',
  LOGIN_REQUIRED_DESC: 'Silakan login untuk melanjutkan ke checkout.',
  PROFILE_INCOMPLETE: 'Data Alamat Belum Lengkap',
  CART_CORRUPTED: 'Data Keranjang Rusak',
  CART_CORRUPTED_DESC: 'Ditemukan data keranjang yang tidak valid. Silakan bersihkan keranjang untuk melanjutkan.',
  CLEAR_CART: 'Bersihkan Keranjang',
  START_SHOPPING: 'Mulai Belanja',
  CONTINUE_SHOPPING: 'Lanjut Belanja',
  EMPTY_CART: 'Keranjang kosong',
  EMPTY_CART_DESC: 'Tambahkan produk ke keranjang untuk memulai belanja.',
  CHECKOUT: 'Checkout',
  CART_TITLE: 'Keranjang Belanja',
  CLEAR_BUTTON: 'Kosongkan',
  ORDER_SUMMARY: 'Ringkasan Pesanan',
  ITEM_COUNT: 'Jumlah item',
  TOTAL: 'Total',
  REMOVE: 'Hapus',
  INVALID_ITEMS_CLEANED: 'Data keranjang dibersihkan',
  INVALID_ITEMS_DESC: (count: number) => `Dihapus ${count} item yang tidak valid.`,
} as const;

export const CART_ROUTES = {
  PRODUCTS: '/products',
  AUTH: '/auth',
  PROFILE: '/profile',
  CHECKOUT: '/checkout',
} as const;

