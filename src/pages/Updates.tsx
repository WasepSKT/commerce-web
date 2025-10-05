import React from 'react';
import { Layout } from '@/components/Layout';
import FaqCollapse, { FaqItem } from '@/components/ui/FaqCollapse';
import { Box } from 'lucide-react';

// Keep Updates page customer-facing and minimal; product/shipping FAQs were moved to Case Studies (customer FAQ)
const FAQS: FaqItem[] = [];

export default function UpdatesPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4 text-primary">Updates & Common Fixes</h1>
        <p className="text-muted-foreground mb-6">Pertanyaan umum dan langkah perbaikan yang sering terjadi.</p>

        <div>
          <div className="w-full border rounded-lg p-6 bg-muted/50 text-muted-foreground flex items-center gap-4">
            <div className="flex-shrink-0">
              <Box className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1 text-primary">Belum ada pembaruan untuk pengguna</h2>
              <p className="mb-0">Halaman ini akan menampilkan panduan perbaikan dan pembaruan umum ketika tersedia.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
