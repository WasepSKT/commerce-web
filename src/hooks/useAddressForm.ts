import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AddressForm } from '@/types/checkout';

export function useAddressForm() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
    province: profile?.province ?? '',
    city: profile?.city ?? '',
    district: profile?.district ?? '',
    subdistrict: profile?.subdistrict ?? '',
    postal_code: profile?.postal_code ?? '',
  });

  // Sync local address form when profile changes
  useEffect(() => {
    setAddressForm({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
      province: profile?.province ?? '',
      city: profile?.city ?? '',
      district: profile?.district ?? '',
      subdistrict: profile?.subdistrict ?? '',
      postal_code: profile?.postal_code ?? '',
    });
  }, [
    profile?.full_name, 
    profile?.phone, 
    profile?.address, 
    profile?.province, 
    profile?.city, 
    profile?.district, 
    profile?.subdistrict, 
    profile?.postal_code
  ]);

  const updateAddressForm = (updates: Partial<AddressForm>) => {
    setAddressForm(prev => ({ ...prev, ...updates }));
  };

  const saveAddress = async () => {
    if (!updateProfile) {
      toast({ 
        variant: 'destructive', 
        title: 'Tidak dapat menyimpan', 
        description: 'Fungsi pembaruan profil tidak tersedia.' 
      });
      return;
    }

    setSavingAddress(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: addressForm.full_name,
        phone: addressForm.phone,
        address: addressForm.address,
        province: addressForm.province,
        city: addressForm.city,
        district: addressForm.district,
        subdistrict: addressForm.subdistrict,
        postal_code: addressForm.postal_code,
      };

      const res = await updateProfile(payload);
      if ('error' in res && res.error) {
        throw res.error;
      }

      toast({ 
        title: 'Berhasil', 
        description: 'Alamat pengiriman disimpan ke profil.' 
      });
      setIsEditingAddress(false);
    } catch (err) {
      console.error('Failed to update profile from checkout', err);
      toast({ 
        variant: 'destructive', 
        title: 'Gagal menyimpan alamat', 
        description: String(err) 
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const cancelEditing = () => {
    setAddressForm({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
      province: profile?.province ?? '',
      city: profile?.city ?? '',
      district: profile?.district ?? '',
      subdistrict: profile?.subdistrict ?? '',
      postal_code: profile?.postal_code ?? '',
    });
    setIsEditingAddress(false);
  };

  return {
    isEditingAddress,
    savingAddress,
    addressForm,
    setIsEditingAddress,
    updateAddressForm,
    saveAddress,
    cancelEditing
  };
}
