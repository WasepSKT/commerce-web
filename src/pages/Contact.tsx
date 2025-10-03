import React, { useRef, useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import ResponsiveAnimation from '@/components/ui/ResponsiveAnimation';
import heroContact from '@/assets/img/hero-contact.png';
import { Link } from 'react-router-dom';

export default function ContactPage() {
  const [open, setOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 50);
  }, [open]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());
    console.log('Contact form submitted', data);
    setOpen(false);
  };

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ResponsiveAnimation
              mobileAnimation="fade-up"
              desktopAnimation="fade-right"
              duration="700"
              easing="ease-out-cubic"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-brand mb-4">Hubungi Regal Paw</h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                Punya pertanyaan tentang produk, distribusi, atau kerja sama? Tim kami siap membantu.
              </p>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="rounded-full px-6 py-2 text-white font-medium"
                  style={{ backgroundColor: '#7A1316' }}
                >
                  Kirim Pesan
                </button>
                <Button variant="ghost" asChild className="rounded-full px-5 py-2 border border-[#7A1316] text-[#7A1316]">
                  <a href="mailto:contact@regalpaw.example">Email Kami</a>
                </Button>
              </div>

              <div className="mt-8 text-sm text-muted-foreground">
                <p>Alamat kantor: Jalan Contoh No.1, Jakarta</p>
                <p>Tel: +62 21 555-0123</p>
              </div>
            </ResponsiveAnimation>

            <ResponsiveAnimation
              mobileAnimation="fade-up"
              desktopAnimation="fade-left"
              duration="700"
              easing="ease-out-cubic"
              delay="200"
              className="flex justify-center lg:justify-end"
            >
              <img src={heroContact} alt="Contact hero" className="w-full max-w-[520px] object-cover" />
            </ResponsiveAnimation>
          </div>
        </div>
      </section>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-lg z-10 overflow-auto max-h-[90vh]">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-2xl font-bold text-brand">Kirim Pesan ke Regal Paw</h3>
                <button aria-label="Close" onClick={() => setOpen(false)} className="text-muted-foreground">✕</button>
              </div>
              <p className="text-muted-foreground mt-2">Isi form berikut dan tim kami akan menghubungi Anda kembali.</p>

              <form onSubmit={handleSend} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="name" ref={nameRef} required placeholder="Nama" className="w-full border rounded-md px-3 py-2 border-[#7A1316] focus:outline-none focus:ring-2 focus:ring-[#7A1316]/25" />
                  <input name="email" type="email" required placeholder="Email" className="w-full border rounded-md px-3 py-2 border-[#7A1316] focus:outline-none focus:ring-2 focus:ring-[#7A1316]/25" />
                </div>
                <input name="subject" placeholder="Subjek" className="w-full border rounded-md px-3 py-2 border-[#7A1316] focus:outline-none focus:ring-2 focus:ring-[#7A1316]/25" />
                <textarea name="message" required rows={5} placeholder="Pesan Anda" className="w-full border rounded-md px-3 py-2 border-[#7A1316] focus:outline-none focus:ring-2 focus:ring-[#7A1316]/25" />

                <div className="flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border">Tutup</button>
                  <button type="submit" className="px-4 py-2 rounded-md bg-[#7A1316] text-white">Kirim</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
