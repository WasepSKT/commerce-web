import React from 'react';
import { FaLeaf, FaFlask, FaHandshake, FaUsers } from 'react-icons/fa';
import tunaImg from '@/assets/img/Tuna.webp';
import salmonImg from '@/assets/img/salmon.webp';
import oceanImg from '@/assets/img/oceanfish.webp';
import { Link } from 'react-router-dom';


export default function AboutSection() {
  // Use local default images (do not rely on product images)
  const images = [tunaImg, oceanImg, salmonImg];

  const features = [
    { title: 'Sertifikasi AACFO', desc: 'Semua Produk telah memenuhi standar nutrisi internasional', icon: FaLeaf },
    { title: 'Riset & Pengembangan', desc: 'Tim ahli kami terus berinovasi untuk formula terbaik', icon: FaFlask },
    { title: 'Kemitraan Global', desc: 'Bekerjasama dengan supplier terpercaya dari berbagai negara', icon: FaHandshake },
    { title: 'Komunitas Pemilik', desc: 'Membangun Komunitas yang peduli kesehatan kucing', icon: FaUsers },
  ];

  return (
    <section className="py-6 md:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
          <p className="text-xl md:text-4xl lg:text-5xl font-extrabold text-[#C6982D]">Tentang Regal Paw</p>
          <h2 className="text-xl md:text-4xl lg:text-5xl text-brand">Dedikasi Kami untuk kesehatan Kucing Indonesia</h2>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-3xl mx-auto mt-4">
            Sejak 2024, Regal Paw menjadi pilihan utama ribuan pemilik kucing di Indonesia. Kami memahami bahwa kucing adalah bagian dari keluarga, dan mereka layak mendapatkan nutrisi terbaik.
            Dengan berkolaborasi bersama ahli nutrisi hewan dan dokter hewan berpengalaman, kami menghadirkan produk-produk berkualitas premium yang telah teruji klinis dan dipercaya oleh para profesional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex items-start gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-full bg-[#7A1316] flex items-center justify-center text-[#F8DF7C] flex-shrink-0">
                  <Icon className="h-4 w-4 sm:h-4 sm:w-4 md:h-6 md:w-6 lg:h-7 lg:w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-brand mb-1">{f.title}</h4>
                  <p className="text-sm md:text-base text-muted-foreground line-clamp-2">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#7A1316] rounded-2xl p-8" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic">
          <div className="flex items-center justify-center gap-12 py-8">
            {images.map((src, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-duration="700"
                data-aos-easing="ease-out-cubic"
                data-aos-delay="200"
              >
                <div role="button" tabIndex={0} aria-label={`Produk ${i + 1}`} className="w-46 h-58 flex items-center justify-center bg-white/0">
                  <div className="transform transition-transform duration-300 hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1">
                    <img src={src} alt={`product-${i}`} className="max-h-full object-contain pointer-events-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8" data-aos="fade-in" data-aos-duration="700" data-aos-easing="ease-out-cubic">
          <Link to="/about">
            <button className="rounded-full bg-[#7A1316] text-[#F8DF7C] px-4 py-2 md:px-6 md:py-3 text-sm md:text-base">Pelajari Lebih Lanjut</button>
          </Link>
        </div>
      </div>
    </section>
  );
}
