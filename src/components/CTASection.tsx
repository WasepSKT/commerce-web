import React from 'react';
import bg from '@/assets/bg/regalpawbg.webp';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FaTruck, FaShieldAlt, FaStar } from 'react-icons/fa';

export default function CTASection() {
  return (
    <section className="py-16 relative overflow-hidden" style={{ backgroundColor: '#FFFFF' }}>
      {/* blurred background image */}
      <img src={bg} alt="background" className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm transform scale-105" />

      <div className="container mx-auto px-4 flex flex-col items-center text-center relative" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
        <h2 className="max-w-5xl text-2xl md:text-4xl lg:text-5xl mb-4 text-brand">
          Berikan yang Terbaik untuk Kucing Kesayangan Anda Hari Ini!
        </h2>
        <p className="text-sm md:text-base mb-8 max-w-3xl mx-auto text-black">
          Jangan menunda - berikan nutrisi premium yang disukai kucing dan dipercaya pemiliknya. Pilih produk terbaik dari Regal Paw sekarang.
        </p>
        <div className="flex items-center justify-center gap-4 mb-12" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
          <Button asChild size="lg" className="rounded-full px-6 py-3 bg-[#7A1316] text-white border-2 border-white">
            <Link to="/products">Mulai Berbelanja</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-6 py-3 border-2 border-white text-white hover:text-brand bg-transparent">
            <Link to="/contact">Konsultasi Gratis</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto justify-center">
          <div tabIndex={0} className="bg-white/80 rounded-2xl p-6 shadow-sm border-2 border-[#7A1316] transform transition-transform duration-200 ease-out focus:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1316]/30 cursor-pointer" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="0">
            <div className="w-12 h-12 rounded-full bg-[#7A1316] text-[#F8DF7C] flex items-center justify-center mx-auto mb-4">
              <FaTruck className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <h3 className="font-semibold text-[#7A1316] text-center mb-2">Pengiriman Cepat</h3>
            <p className="text-xs md:text-sm text-[#7A1316]/80 text-center">Dapatkan pengiriman cepat untuk pesanan Anda</p>
          </div>

          <div tabIndex={0} className="bg-white/80 rounded-2xl p-6 shadow-sm border-2 border-[#7A1316] hover:scale-105 transform transition-transform duration-200 ease-out focus:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1316]/30 cursor-pointer" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
            <div className="w-12 h-12 rounded-full bg-[#7A1316] text-[#F8DF7C] flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <h3 className="font-semibold text-[#7A1316] text-center mb-2">Garansi Kualitas</h3>
            <p className="text-xs md:text-sm text-[#7A1316]/80 text-center">100% uang kembali jika tidak puas</p>
          </div>

          <div tabIndex={0} className="bg-white/80 rounded-2xl p-6 shadow-sm border-2 border-[#7A1316] hover:scale-105 transform transition-transform duration-200 ease-out focus:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1316]/30 cursor-pointer" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="200">
            <div className="w-12 h-12 rounded-full bg-[#7A1316] text-[#F8DF7C] flex items-center justify-center mx-auto mb-4">
              <FaStar className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <h3 className="font-semibold text-[#7A1316] text-center mb-2">Support 24/7</h3>
            <p className="text-xs md:text-sm text-[#7A1316]/80 text-center">Tim ahli siap membantu kapan saja</p>
          </div>
        </div>
      </div>
    </section>
  );
}