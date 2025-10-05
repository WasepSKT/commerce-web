import React from 'react';
import { Check, Handshake, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ResponsiveAOS from '@/components/ui/ResponsiveAOS';
import referralImg from '@/assets/img/img-referal.png';

export default function ReferralCareerSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ResponsiveAOS
            mobileAnimation="fade-up"
            desktopAnimation="fade-right"
            duration="700"
            easing="ease-out-cubic"
            delay="100"
          >
            <h2 className="text-4xl text-brand mb-6">Program Referral & Karir</h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Bergabunglah dengan tim kami atau dapatkan penghasilan tambahan melalui
              program referral yang menguntungkan.
            </p>
            <div className="mt-6 flex justify-center lg:justify-start w-full">
              <img src={referralImg} alt="Referral" className="w-full object-contain" />
            </div>
          </ResponsiveAOS>

          <ResponsiveAOS
            mobileAnimation="fade-up"
            desktopAnimation="fade-left"
            duration="700"
            easing="ease-out-cubic"
            delay="200"
          >
            <div className="bg-[#7A1316] rounded-2xl p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="bg-white/10 rounded-lg p-3 flex items-center justify-center">
                  <Handshake className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Program Referral</h3>
                  <p className="text-sm text-white/80">Dapatkan komisi hingga 15% untuk setiap penjualan</p>
                </div>
              </div>

              <ul className="mt-6 space-y-4">
                <li className="flex items-center gap-3"><Check className="text-[#F8DF7C]" /> Komisi 15% untuk setiap penjualan berhasil</li>
                <li className="flex items-center gap-3"><Check className="text-[#F8DF7C]" /> Bonus tambahan untuk target bulanan</li>
                <li className="flex items-center gap-3"><Check className="text-[#F8DF7C]" /> Dashboard tracking real-time</li>
                <li className="flex items-center gap-3"><Check className="text-[#F8DF7C]" /> Pelatihan dan dukungan marketing</li>
                <li className="flex items-center gap-3"><Check className="text-[#F8DF7C]" /> Materi promosi lengkap (marketing kit) yang siap pakai.</li>
              </ul>

              <div className="mt-6 bg-white/20 rounded-lg p-8">
                <p className="text-sm text-white/90">Potensi Penghasilan Bulanan:</p>
                <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">1-5 juta</p>
                    <p className="text-sm text-white/80">Pemula</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">5-10 juta</p>
                    <p className="text-sm text-white/80">Aktif</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">10-15 juta</p>
                    <p className="text-sm text-white/80">Pro</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link to="/signup" aria-label="Daftar Sekarang">
                  <Button
                    className="bg-white text-brand rounded-full px-6 py-3 inline-flex items-center gap-2 transform transition-transform duration-200 hover:translate-x-1 hover:bg-white hover:text-brand/90"
                  >
                    <span>Daftar Sekarang</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </ResponsiveAOS>
        </div>
      </div>
    </section>
  );
}
