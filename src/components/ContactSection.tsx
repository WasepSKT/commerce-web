import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';

export default function ContactSection() {
  return (
    <section className="py-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="overflow-hidden">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-brand text-center mb-4" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic">Hubungi Kami Hari ini</h2>
          <p className="text-muted-foreground mb-8 text-center max-w-2xl mx-auto" data-aos="fade-up" data-aos-duration="800" data-aos-easing="ease-out-cubic">
            Ada pertanyaan tentang produk atau ingin konsultasi nutrisi kucing? Tim ahli kami siap membantu Anda.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div data-aos="fade-right" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <input aria-label="Nama" placeholder="Nama" className="input input-bordered w-full rounded-xl p-4 bg-gray-100 border-2 border-[#7A1316] focus:outline-none focus:ring-2 focus:ring-[#7A1316]/40" />
                <input aria-label="Email" placeholder="email@contoh.com" className="input input-bordered w-full rounded-xl p-4 bg-gray-100 border-2 border-[#7A1316] focus:outline-none focus:ring-2 focus:ring-[#7A1316]/40" />
                <input aria-label="Telepon" placeholder="(012) 345 - 6789" className="input input-bordered w-full rounded-xl p-4 bg-gray-100 border-2 border-[#7A1316] focus:outline-none focus:ring-2 focus:ring-[#7A1316]/40" />
                <input aria-label="Perusahaan" placeholder="Perusahaan (opsional)" className="input input-bordered w-full rounded-xl p-4 bg-gray-100 border-2 border-[#7A1316] focus:outline-none focus:ring-2 focus:ring-[#7A1316]/40" />

                <textarea aria-label="Pesan" placeholder="Tulis pesan Anda di sini..." className="col-span-1 sm:col-span-2 rounded-xl p-4 bg-gray-100 border-2 border-[#7A1316] focus:outline-none focus:ring-2 focus:ring-[#7A1316]/40 h-32 resize-none" />

                <div className="col-span-1 sm:col-span-2 flex items-center gap-4">
                  <Button className="rounded-full bg-[#7A1316] text-[#F8DF7C] px-6 py-3">Kirim Pesan</Button>
                  <div className="flex items-center gap-3 ml-4 text-muted-foreground">
                    <button aria-label="Facebook" className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center"><FaFacebookF className="h-4 w-4 text-gray-700" /></button>
                    <button aria-label="X / Twitter" className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center"><FaTwitter className="h-4 w-4 text-gray-700" /></button>
                    <button aria-label="Instagram" className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center"><FaInstagram className="h-4 w-4 text-gray-700" /></button>
                  </div>
                </div>
              </form>
            </div>

            <div data-aos="fade-left" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
              <div className="bg-[#7A1316] rounded-2xl p-8 text-white">
                <p className="text-sm uppercase tracking-wider text-white/80">Contact Us</p>
                <h3 className="text-2xl font-bold text-[#F8DF7C] mt-2">PT. Guna Aura Gemilang</h3>
                <p className="text-white/80 mt-4">Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi melalui email atau telepon. Kami akan merespon secepatnya.</p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-white/90" />
                    <span>contact@regalpaw.id</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-white/90" />
                    <span>(021) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-white/90" />
                    <span>Jl. Contoh No. 123, Jakarta</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
