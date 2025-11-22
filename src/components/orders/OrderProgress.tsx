import React from 'react';
import { CheckCircle, Clock, Truck, Package, CreditCard } from 'lucide-react';
import { ExternalLink, Copy } from 'lucide-react';

type Props = {
  status: string;
  payment_method?: string | null;
  payment_channel?: string | null;
  shipping_cost?: number | null;
  tracking_number?: string | null;
  shipping_courier?: string | null;
  created_at?: string;
};

const steps = [
  { key: 'ordered', label: 'Dipesan', icon: Clock },
  { key: 'processed', label: 'Pesanan Diproses', icon: Package },
  { key: 'shipped', label: 'Dikirim', icon: Truck },
  { key: 'delivered', label: 'Diterima', icon: CheckCircle },
];

function statusToStepIndex(status: string) {
  const map: Record<string, number> = {
    pending: 0,
    processing: 1,
    shipped: 2,
    delivered: 3,
    cancelled: 0,
  };
  return map[status as keyof typeof map] ?? 0;
}

export default function OrderProgress({ status, payment_method, payment_channel, shipping_cost, tracking_number, shipping_courier, created_at }: Props) {
  const current = statusToStepIndex(status || 'pending');

  const paymentLabel = (s: string | undefined | null) => {
    if (!s) return '—';
    return s;
  };

  const paymentStatusLabel = (st: string) => {
    if (st === 'pending') return { label: 'Menunggu Pembayaran', tone: 'amber' };
    if (st === 'cancelled') return { label: 'Dibatalkan', tone: 'rose' };
    // Treat 'paid', 'delivered', 'completed' as paid/settled
    if (st === 'paid' || st === 'delivered' || st === 'completed') return { label: 'Lunas', tone: 'emerald' };
    // Fallback: show localized-ish default
    return { label: st.charAt(0).toUpperCase() + st.slice(1), tone: 'gray' };
  };

  const payStatus = paymentStatusLabel(status || 'pending');

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-primary">Status Pesanan</h4>
          <div className="text-xs text-muted-foreground mt-1">{created_at ? new Date(created_at).toLocaleString('id-ID') : ''}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">Metode Pembayaran</div>
          <div className="text-sm font-medium">{paymentLabel(payment_method ?? payment_channel)}</div>
          <div className={`ml-3 px-2 py-0.5 rounded text-xs font-medium ${payStatus.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : payStatus.tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
            {payStatus.label}
          </div>
        </div>
      </div>

      {/* Horizontal stepper for md+ */}
      <div className="hidden md:block mt-4 overflow-x-auto">
        <div className="flex items-center w-full">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = i <= current;
            return (
              <React.Fragment key={s.key}>
                <div className="flex-1 flex flex-col items-center text-center px-2">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${done ? 'bg-primary text-white shadow' : 'bg-gray-50 text-muted-foreground border'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`mt-2 text-sm w-full truncate ${done ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{s.label}</div>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-none w-8 md:w-12 lg:w-16 mx-2 flex items-center`}>
                    <div className={`h-1 w-full rounded ${i < current ? 'bg-primary' : 'bg-gray-200'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Stacked timeline for small screens */}
      <div className="md:hidden mt-3 space-y-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = i <= current;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full ${done ? 'bg-primary text-white' : 'bg-gray-100 text-muted-foreground'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${done ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{s.label}</div>
                {i === current && <div className="text-xs text-muted-foreground">Status saat ini</div>}
              </div>
              {done && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Extra info */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Biaya Pengiriman</div>
          <div className="font-medium">{typeof shipping_cost === 'number' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(shipping_cost) : '—'}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Nomor Resi</div>
          <div className="font-medium">{tracking_number ?? '—'}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Status Pembayaran</div>
          <div className="font-medium">
            {status === 'pending' && 'Menunggu Pembayaran'}
            {status === 'cancelled' && 'Dibatalkan'}
            {(status === 'paid' || status === 'delivered' || status === 'completed') && 'Lunas'}
            {status && !['pending', 'cancelled', 'paid', 'delivered', 'completed'].includes(status) && (status.charAt(0).toUpperCase() + status.slice(1))}
            {!status && '—'}
          </div>
        </div>
      </div>

      {/* External courier tracking section */}
      <div className="mt-4">
        <h5 className="text-sm font-medium text-primary mb-2">Pelacakan Eksternal</h5>
        {tracking_number && shipping_courier ? (
          (() => {
            const COURIER_TRACKING: Record<string, (r: string) => string> = {
              JNE: (r) => `https://www.jne.co.id/id/tracking/trace?awb=${encodeURIComponent(r)}`,
              JNT: (r) => `https://tracking.jntos.co.id/waybill/${encodeURIComponent(r)}`,
              SICEPAT: (r) => `https://tracking.sicepat.com/track/?awb=${encodeURIComponent(r)}`,
              TIKI: (r) => `https://www.tiki.id/track?resi=${encodeURIComponent(r)}`,
              POS: (r) => `https://posindonesia.co.id/trackandtrace?resi=${encodeURIComponent(r)}`,
              WAHANA: (r) => `https://www.wahana.com/fcs/waybill?awb=${encodeURIComponent(r)}`,
              JANDT: (r) => `https://jeki.id/track/${encodeURIComponent(r)}`,
            };

            const key = String(shipping_courier).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const fn = COURIER_TRACKING[key];
            if (fn) {
              return (
                <a href={fn(tracking_number)} target="_blank" rel="noreferrer">
                  <button type="button" className="inline-flex items-center px-3 py-1.5 border border-primary text-primary rounded text-sm hover:bg-primary hover:text-white">
                    Lihat Pelacakan di {shipping_courier}
                  </button>
                </a>
              );
            }

            return <div className="text-sm text-muted-foreground">Kurir tidak dikenali untuk pelacakan eksternal.</div>;
          })()
        ) : (
          <div className="text-sm text-muted-foreground">Nomor resi atau kurir belum tersedia untuk pelacakan eksternal.</div>
        )}
      </div>
    </div>
  );
}
