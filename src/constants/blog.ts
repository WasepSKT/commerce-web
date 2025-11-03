/**
 * Constants for blog pages
 */

export const BLOG_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
} as const;

export const BLOG_MESSAGES = {
  LOAD_ERROR: 'Gagal memuat artikel',
  LOAD_ERROR_DESC: 'Terjadi kesalahan saat memuat artikel blog.',
  NO_ARTICLES: 'Belum Ada Artikel',
  NO_ARTICLES_DESC: 'Artikel blog sedang dalam tahap pengembangan. Silakan kembali lagi nanti!',
  NO_ARTICLES_ADMIN: 'Mulai menulis artikel pertama Anda untuk dibagikan dengan pengunjung',
  NO_ARTICLES_USER: 'Artikel sedang dalam persiapan. Kembali lagi nanti untuk membaca konten menarik!',
  LOADING: 'Memuat artikel...',
  FEATURED: 'Featured',
  BLOG: 'Blog',
  READ_MORE: 'Baca Selengkapnya',
  READ: 'Baca',
  READ_SHORT: 'Baca →',
  LOAD_MORE: 'Muat Lebih Banyak Artikel',
  REMOVE_FILTER: 'Hapus filter',
  AUTHOR: 'Admin',
  WRITE_FIRST: 'Tulis Artikel Pertama',
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  NO_COVER: 'No Cover',
} as const;

export const BLOG_ROUTES = {
  HOME: '/blog',
} as const;

