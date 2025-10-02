import React from 'react';
import Marquee from 'react-fast-marquee';
import { Star } from 'lucide-react';
import { testimonials } from '@/data/testimonials';

export default function TestimonialSection() {
  return (
    <section className="py-16" data-aos="zoom-in" data-aos-duration="700" data-aos-easing="ease-out-cubic">
      <div>
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-brand">Apa Kata Mereka?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Ribuan pemilik kucing telah merasakan manfaat produk Regal Paw untuk kesehatan kucing kesayangan mereka</p>
        </div>

        <div className="overflow-hidden">
          <Marquee pauseOnHover gradient={false} speed={40} className="py-4" data-testid="testimonial-marquee">
            <div className="flex items-stretch gap-6 px-4">
              {testimonials.map((t) => (
                <article
                  key={t.id}
                  className="min-w-[320px] max-w-[320px] bg-card rounded-2xl p-6 border border-border shadow-sm transition-transform transform hover:scale-105 hover:shadow-lg hover:border-[#7A1316] cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="h-5 w-5 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm italic mb-4">{`"${t.text}"`}</p>
                  <h4 className="text-base font-semibold text-brand mb-0">{t.name}</h4>
                  <p className="text-sm text-muted-foreground">{t.title}</p>
                </article>
              ))}
            </div>
          </Marquee>
        </div>
      </div>
    </section>
  );
}
