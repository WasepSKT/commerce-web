import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import useCart from '@/hooks/useCart';
import { Layout } from '@/components/Layout';
import useEmblaCarousel from 'embla-carousel-react';
import tunaImg from '@/assets/img/Tuna.png';
import salmonImg from '@/assets/img/salmon.png';
import oceanfishImg from '@/assets/img/oceanfish.png';

// Simple slide data for the carousel
const slidesData = [
  {
    id: 'tuna',
    title: 'TUNA',
    price: 45000,
    benefits: ['Protein tinggi', 'Mudah dicerna', 'Sumber vitamin & mineral'],
    description:
      'Produk ini terbuat dari tuna dan hasil sampingan ikan, dipadukan dengan bahan pembentuk gel, serta diperkaya dengan vitamin dan mineral esensial.',
    img: tunaImg,
  },
  {
    id: 'oceanfish',
    title: 'OCEAN FISH',
    price: 48000,
    benefits: ['Rasa laut alami', 'Suplemen energi', 'Cocok untuk sensitif'],
    description:
      'Kaya akan rasa laut yang lezat dan sumber protein berkualitas tinggi untuk kucing Anda. Formulanya ringan dan mudah dicerna, cocok untuk kucing dengan selera sensitif dan membantu menjaga energi harian.',
    img: oceanfishImg,
  },
  {
    id: 'salmon',
    title: 'SALMON',
    price: 52000,
    benefits: ['Omega-3 tinggi', 'Kulit & bulu sehat', 'Kualitas premium'],
    description:
      'Salmon premium dengan kandungan omega-3 yang tinggi untuk mendukung kesehatan kulit dan kilau bulu, serta meningkatkan fungsi jantung dan daya tahan tubuh.',
    img: salmonImg,
  },
];

function ProductCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center', containScroll: 'trimSnaps' });
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<typeof slidesData[number] | null>(null);
  const mountedRef = useRef(false);
  const navigate = useNavigate();
  const { add } = useCart();

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      try {
        setSelected(emblaApi.selectedScrollSnap());
        setCanPrev(Boolean(emblaApi.canScrollPrev && emblaApi.canScrollPrev()));
        setCanNext(Boolean(emblaApi.canScrollNext && emblaApi.canScrollNext()));
      } catch (e) {
        // ignore
      }
    };
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      try {
        emblaApi.off('select', onSelect);
      } catch (e) {
        // ignore
      }
    };
  }, [emblaApi]);

  // autoplay on mount (gentle)
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    let id: number | undefined;
    if (emblaApi) {
      id = window.setInterval(() => {
        try {
          emblaApi.scrollNext();
        } catch (e) {
          // ignore
        }
      }, 4500) as unknown as number;
    }
    return () => {
      if (id) window.clearInterval(id as number);
    };
  }, [emblaApi]);

  return (
    <div className="relative">
      {/* prev/next controls */}
      <button
        aria-label="Previous"
        onClick={() => emblaApi && emblaApi.scrollPrev()}
        disabled={!canPrev}
        className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full shadow-md flex items-center justify-center ${!canPrev ? 'opacity-40 cursor-not-allowed' : ''}`}
        style={{ background: '#ffffff' }}
      >
        <svg className="w-4 h-4 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        aria-label="Next"
        onClick={() => emblaApi && emblaApi.scrollNext()}
        disabled={!canNext}
        className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full shadow-md flex items-center justify-center ${!canNext ? 'opacity-40 cursor-not-allowed' : ''}`}
        style={{ background: '#ffffff' }}
      >
        <svg className="w-4 h-4 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div className="embla">
        <div className="embla__viewport overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex gap-6 items-center">
            {slidesData.map((s, idx) => (
              <div key={s.id} className="embla__slide min-w-full flex items-center justify-center px-4 sm:px-6">
                <div className="relative overflow-hidden h-[60vh] md:h-[70vh] lg:h-[75vh] flex items-center justify-center w-full">
                  <img src={s.img} alt={s.title} className="max-h-full object-contain w-auto mx-auto" />

                  {/* click opens modal */}
                  <button
                    aria-label={`Open details for ${s.title}`}
                    onClick={() => {
                      setModalProduct(s);
                      setModalOpen(true);
                    }}
                    className="absolute inset-0 bg-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product modal (portal to body to avoid clipping) */}
      {modalOpen && modalProduct && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-white/95 rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-2xl z-10 overflow-auto transform transition-all duration-200">
            <button aria-label="Close" className="absolute right-4 top-4 text-muted-foreground" onClick={() => setModalOpen(false)}>
              ✕
            </button>
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              <div className="w-full lg:w-1/2 flex items-center justify-center bg-transparent">
                <img src={modalProduct.img} alt={modalProduct.title} className="max-h-[420px] object-contain rounded-lg" />
              </div>
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                <h3 className="text-3xl font-extrabold text-brand mb-2">{modalProduct.title}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-primary">{typeof modalProduct.price === 'number' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(modalProduct.price) : ''}</span>
                  <span className="text-sm text-muted-foreground">/ pack</span>
                </div>
                <p className="text-muted-foreground mb-4">{modalProduct.description}</p>

                {Array.isArray(modalProduct.benefits) && (
                  <ul className="mb-4 space-y-2">
                    {modalProduct.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-green-600 mt-1">✔</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <button
                    className="rounded-full bg-[#7A1316] text-white px-5 py-2 text-sm font-medium shadow"
                    onClick={() => {
                      if (modalProduct) {
                        add(modalProduct.id, 1);
                      }
                      setModalOpen(false);
                      navigate('/products');
                    }}
                  >
                    Belanja Sekarang
                  </button>
                  <button className="rounded-full border border-[#7A1316] text-[#7A1316] px-4 py-2 text-sm" onClick={() => setModalOpen(false)}>Tutup</button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function AboutPage() {
  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-brand mb-4">Tentang Regal Paw</h1>
            <p className="text-lg text-muted-foreground">
              Regal Paw berdedikasi untuk menghadirkan nutrisi kucing berkualitas tinggi yang dirancang berdasarkan penelitian dan praktik terbaik dalam nutrisi hewan.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic">
              <h2 className="text-2xl font-semibold text-brand mb-4">Misi Kami</h2>
              <p className="text-muted-foreground mb-6">
                Menyediakan produk nutrisi kucing yang aman, bergizi, dan terjangkau untuk membantu setiap kucing mencapai kesehatan optimal.
              </p>

              <h2 className="text-2xl font-semibold text-brand mb-4">Visi</h2>
              <p className="text-muted-foreground mb-6">
                Menjadi merek nutrisi hewan terkemuka di Indonesia yang dipercaya oleh pemilik kucing dan profesional perawatan hewan.
              </p>

              <h2 className="text-2xl font-semibold text-brand mb-4">Nilai Inti</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Keamanan & kualitas bahan baku</li>
                <li>Riset berbasis ilmiah</li>
                <li>Transparansi proses produksi</li>
              </ul>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Dukungan komunitas pemilik adalah salah satu pilar kami. Kami secara aktif membina
                  forum edukasi, grup diskusi, dan program konsultasi gratis bersama dokter hewan
                  dan ahli nutrisi hewan. Melalui webinar, artikel, dan sesi tanya jawab rutin, kami
                  membantu pemilik kucing memilih produk dan pola makan yang tepat sesuai usia,
                  kondisi kesehatan, dan preferensi makan kucing mereka.
                </p>
              </div>
            </div>

            <div data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="200">
              <ProductCarousel />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic">
            <div className="rounded-xl p-6" style={{ background: '#7A1316' }}>
              <h4 className="text-lg font-semibold mb-3 text-white">Sertifikasi AACFO</h4>
              <p className="text-sm text-white/90">Semua produk Regal Paw disusun sesuai panduan nutrisi internasional AACFO. Setiap batch melewati uji komposisi nutrisi dan kontrol mutu yang ketat untuk memastikan kandungan protein, lemak, serat, vitamin, dan mineral sesuai label dan standar keamanan pangan hewan.</p>
            </div>
            <div className="rounded-xl p-6" style={{ background: '#7A1316' }}>
              <h4 className="text-lg font-semibold mb-3 text-white">Riset & Pengembangan</h4>
              <p className="text-sm text-white/90">Tim R&D kami terdiri dari ahli nutrisi hewan dan dokter hewan yang melakukan pengujian formulasi, studi pencernaan, dan uji rasa. Produk dikembangkan melalui iterasi laboratorium dan uji konsumsi untuk memastikan mereka aman, bergizi, dan disukai kucing pada berbagai tahap hidup.</p>
            </div>
            <div className="rounded-xl p-6" style={{ background: '#7A1316' }}>
              <h4 className="text-lg font-semibold mb-3 text-white">Kemitraan Global</h4>
              <p className="text-sm text-white/90">Regal Paw bekerja sama dengan pemasok bahan baku terkemuka dari beberapa negara untuk mendapatkan protein, asam lemak, dan suplemen berkualitas. Rantai pasok diaudit secara berkala untuk menjaga standar etika, keberlanjutan, dan traceability bahan baku.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}