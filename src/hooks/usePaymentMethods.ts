import { useState } from 'react';
import { 
  PAYMENT_METHODS, 
  DEFAULT_PAYMENT_METHOD, 
  DEFAULT_EWALLET, 
  DEFAULT_BANK 
} from '@/constants/paymentMethods';

export function usePaymentMethods() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(DEFAULT_PAYMENT_METHOD);
  const [selectedEwallet, setSelectedEwallet] = useState<string>(DEFAULT_EWALLET);
  const [selectedBank, setSelectedBank] = useState<string>(DEFAULT_BANK);

  const handlePaymentMethodChange = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleEwalletChange = (ewallet: string) => {
    setSelectedEwallet(ewallet);
  };

  const handleBankChange = (bank: string) => {
    setSelectedBank(bank);
  };

  const getPaymentChannel = () => {
    if (selectedPaymentMethod === 'EWALLET') {
      return selectedEwallet;
    }
    if (selectedPaymentMethod === 'VIRTUAL_ACCOUNT') {
      return selectedBank;
    }
    return undefined;
  };

  return {
    paymentMethods: PAYMENT_METHODS,
    selectedPaymentMethod,
    selectedEwallet,
    selectedBank,
    handlePaymentMethodChange,
    handleEwalletChange,
    handleBankChange,
    getPaymentChannel
  };
}
