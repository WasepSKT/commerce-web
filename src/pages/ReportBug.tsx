import React from 'react';
import { Layout } from '@/components/Layout';
import { Bug } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReportBugPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4 text-primary">Laporkan Bug / Masalah</h1>

        <p className="text-muted-foreground mb-6">
          Terima kasih sudah membantu kami memperbaiki layanan. Silakan ikuti langkah di bawah agar tim kami dapat menanggapi lebih cepat.
        </p>

        <div className="w-full border rounded-lg p-6 bg-muted/50 text-muted-foreground flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <Bug className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2 text-primary">Langkah melaporkan bug</h2>
            <ol className="list-decimal list-inside text-sm space-y-2">
              <li><strong>Judul singkat:</strong> ringkasan 3–6 kata (mis. "Error saat checkout - kartu ditolak").</li>
              <li><strong>Langkah reproduksi:</strong> urutkan langkah konkret agar kami bisa meniru masalah (mis. login → tambah produk → checkout → pilih metode X).</li>
              <li><strong>Hasil yang diharapkan vs aktual:</strong> jelaskan apa yang Anda kira seharusnya terjadi dan apa yang terjadi sebenarnya.</li>
              <li><strong>Screenshot / rekaman singkat:</strong> lampirkan gambar atau video singkat yang menunjukkan masalah (maks. 5 MB per file bila memungkinkan).</li>
              <li><strong>Browser / perangkat & waktu:</strong> sebutkan browser (Chrome/Firefox), versi, perangkat (Android/iOS/Windows/Mac) dan perkiraan waktu kejadian.</li>
            </ol>

            <p className="mt-4 mb-0">
              Setelah siap, silakan kirimkan laporan melalui halaman <Link to="/contact" className="text-primary underline">Kontak</Link> — pilih kategori "Laporan Bug" dan sertakan detail di atas. Tim kami akan menghubungi Anda kembali setelah verifikasi.
            </p>

            <p className="text-xs text-muted-foreground mt-3">Catatan: kami menghargai privasi Anda. Informasi yang Anda berikan hanya digunakan untuk investigasi dan perbaikan.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
