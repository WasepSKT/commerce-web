import OVOIcon from '@/assets/img/Logo OVO.png';
import GoPayIcon from '@/assets/img/LOGO-GOPAY.png';
import DANAIcon from '@/assets/img/Logo DANA.png';
import BCAIcon from '@/assets/img/Logo BCA_Biru.png';
import BRIIcon from '@/assets/img/BRI_2020.png';
import MandiriIcon from '@/assets/img/Bank_Mandiri_logo.png';
import BNIIcon from '@/assets/img/Bank_Negara_Indonesia_logo.png';

export const PAYMENT_METHODS = [
  { 
    id: 'QRIS', 
    name: 'QRIS', 
    description: 'Pembayaran QRIS melalui aplikasi bank/dompet digital' 
  },
  { 
    id: 'EWALLET', 
    name: 'E-Wallet', 
    description: 'Dompet digital (OVO, GoPay, Dana) sesuai ketersediaan' 
  },
  { 
    id: 'VIRTUAL_ACCOUNT', 
    name: 'Virtual Account', 
    description: 'Transfer bank via Virtual Account (BRI, BCA, BNI, Mandiri, etc.)' 
  },
] as const;

export const EWALLET_OPTIONS = ['OVO', 'GOPAY', 'DANA'] as const;
export const BANK_OPTIONS = ['BCA', 'BNI', 'BRI', 'MANDIRI'] as const;

export const EWALLET_ICONS: Record<string, string> = {
  OVO: OVOIcon,
  GOPAY: GoPayIcon,
  DANA: DANAIcon,
};

export const BANK_ICONS: Record<string, string> = {
  BCA: BCAIcon,
  BNI: BNIIcon,
  BRI: BRIIcon,
  MANDIRI: MandiriIcon,
};

export const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS[0].id;
export const DEFAULT_EWALLET = 'OVO';
export const DEFAULT_BANK = 'BCA';
