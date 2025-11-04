import { CHECKOUT_MESSAGES, PAYMENT_METHODS, EWALLETS, BANKS } from '@/constants/checkout';
import OVOIcon from '@/assets/img/Logo OVO.png';
import GoPayIcon from '@/assets/img/LOGO-GOPAY.png';
import DANAIcon from '@/assets/img/Logo DANA.png';
import BCAIcon from '@/assets/img/Logo BCA_Biru.png';
import BRIIcon from '@/assets/img/BRI_2020.png';
import MandiriIcon from '@/assets/img/Bank_Mandiri_logo.png';
import BNIIcon from '@/assets/img/Bank_Negara_Indonesia_logo.png';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  setSelectedMethod: (v: string) => void;
  selectedEwallet: string;
  setSelectedEwallet: (v: string) => void;
  selectedBank: string;
  setSelectedBank: (v: string) => void;
}

export default function PaymentMethodSelector({
  selectedMethod,
  setSelectedMethod,
  selectedEwallet,
  setSelectedEwallet,
  selectedBank,
  setSelectedBank,
}: PaymentMethodSelectorProps) {
  const ewalletIcons: Record<string, string> = { OVO: OVOIcon, GOPAY: GoPayIcon, DANA: DANAIcon };
  const bankIcons: Record<string, string> = { BCA: BCAIcon, BNI: BNIIcon, BRI: BRIIcon, MANDIRI: MandiriIcon };

  return (
    <div className="mb-3">
      <h4 className="font-medium mb-2 text-primary">{CHECKOUT_MESSAGES.PAYMENT_METHOD}</h4>
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.id}
              type="button"
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary/50 ${selectedMethod === pm.id ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-gray-300 hover:border-primary'}`}
              onClick={() => setSelectedMethod(pm.id)}
              aria-pressed={selectedMethod === pm.id}
              title={pm.description}
            >
              {pm.name}
            </button>
          ))}
        </div>

        {selectedMethod === 'EWALLET' && (
          <div className="mt-2">
            <label className="text-xs text-muted-foreground mb-1 block">{CHECKOUT_MESSAGES.EWALLET_LABEL}</label>
            <div className="flex gap-2 flex-wrap">
              {EWALLETS.map((wallet) => (
                <button
                  key={wallet}
                  type="button"
                  className={`flex items-center justify-center px-1 py-1 rounded border transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary/30 ${selectedEwallet === wallet ? 'bg-primary/10 border-primary' : 'bg-white border-gray-300 hover:bg-primary/5 hover:border-primary'}`}
                  onClick={() => setSelectedEwallet(wallet)}
                  aria-pressed={selectedEwallet === wallet}
                  aria-label={wallet}
                  title={wallet}
                >
                  <img src={ewalletIcons[wallet]} alt={`${wallet} icon`} className="h-10 w-20 object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedMethod === 'VIRTUAL_ACCOUNT' && (
          <div className="mt-2">
            <label className="text-xs text-muted-foreground mb-1 block">{CHECKOUT_MESSAGES.VA_LABEL}</label>
            <div className="flex gap-2 flex-wrap">
              {BANKS.map((bank) => (
                <button
                  key={bank}
                  type="button"
                  className={`flex items-center justify-center px-1 py-1 rounded border transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary/30 ${selectedBank === bank ? 'bg-primary/10 border-primary' : 'bg-white border-gray-300 hover:bg-primary/5 hover:border-primary'}`}
                  onClick={() => setSelectedBank(bank)}
                  aria-pressed={selectedBank === bank}
                  aria-label={bank}
                  title={bank}
                >
                  <img src={bankIcons[bank]} alt={`${bank} logo`} className="h-10 w-20 object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


