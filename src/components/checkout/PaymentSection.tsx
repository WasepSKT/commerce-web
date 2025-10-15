import {
  PAYMENT_METHODS,
  EWALLET_OPTIONS,
  BANK_OPTIONS,
  EWALLET_ICONS,
  BANK_ICONS
} from '@/constants/paymentMethods';

interface PaymentSectionProps {
  selectedPaymentMethod: string;
  selectedEwallet: string;
  selectedBank: string;
  onPaymentMethodChange: (methodId: string) => void;
  onEwalletChange: (ewallet: string) => void;
  onBankChange: (bank: string) => void;
}

export default function PaymentSection({
  selectedPaymentMethod,
  selectedEwallet,
  selectedBank,
  onPaymentMethodChange,
  onEwalletChange,
  onBankChange
}: PaymentSectionProps) {
  return (
    <div className="mb-3">
      <h4 className="font-medium mb-2">Metode Pembayaran</h4>
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.id}
              type="button"
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary/50 ${selectedPaymentMethod === pm.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-primary border-gray-300 hover:border-primary'
                }`}
              onClick={() => onPaymentMethodChange(pm.id)}
              aria-pressed={selectedPaymentMethod === pm.id}
              title={pm.description}
            >
              {pm.name}
            </button>
          ))}
        </div>

        {selectedPaymentMethod === 'EWALLET' && (
          <div className="mt-2">
            <label className="text-xs text-muted-foreground mb-1 block">
              Pilih Dompet Digital
            </label>
            <div className="flex gap-2 flex-wrap">
              {EWALLET_OPTIONS.map(wallet => (
                <button
                  key={wallet}
                  type="button"
                  className={`flex items-center justify-center px-1 py-1 rounded border transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary/30 ${selectedEwallet === wallet
                      ? 'bg-primary/10 border-primary'
                      : 'bg-white border-gray-300 hover:bg-primary/5 hover:border-primary'
                    }`}
                  onClick={() => onEwalletChange(wallet)}
                  aria-pressed={selectedEwallet === wallet}
                  aria-label={wallet}
                  title={wallet}
                >
                  <img
                    src={EWALLET_ICONS[wallet]}
                    alt={`${wallet} icon`}
                    className="h-10 w-20 object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedPaymentMethod === 'VIRTUAL_ACCOUNT' && (
          <div className="mt-2">
            <label className="text-xs text-muted-foreground mb-1 block">
              Pilih Bank (VA)
            </label>
            <div className="flex gap-2 flex-wrap">
              {BANK_OPTIONS.map(bank => (
                <button
                  key={bank}
                  type="button"
                  className={`flex items-center justify-center px-1 py-1 rounded border transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary/30 ${selectedBank === bank
                      ? 'bg-primary/10 border-primary'
                      : 'bg-white border-gray-300 hover:bg-primary/5 hover:border-primary'
                    }`}
                  onClick={() => onBankChange(bank)}
                  aria-pressed={selectedBank === bank}
                  aria-label={bank}
                  title={bank}
                >
                  <img
                    src={BANK_ICONS[bank]}
                    alt={`${bank} logo`}
                    className="h-10 w-20 object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
