import React from 'react';
import { FaLeaf, FaFlask, FaHandshake, FaUsers } from 'react-icons/fa';
import tunaImg from '@/assets/img/Tuna.png';
import salmonImg from '@/assets/img/salmon.png';
import oceanImg from '@/assets/img/oceanfish.png';
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
              <div key={f.title} className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-[#7A1316] flex items-center justify-center text-[#F8DF7C]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-semibold text-brand mb-1">{f.title}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">{f.desc}</p>
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
