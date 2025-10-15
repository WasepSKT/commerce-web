import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import AddressSelectors from '@/components/profile/AddressSelectors';
import { AddressForm } from '@/types/checkout';

interface AddressSectionProps {
  profile: any; // UserProfile type from useAuth
  isEditingAddress: boolean;
  savingAddress: boolean;
  addressForm: AddressForm;
  onEditClick: () => void;
  onSaveAddress: () => void;
  onCancelEditing: () => void;
  onUpdateAddressForm: (updates: Partial<AddressForm>) => void;
}

export default function AddressSection({
  profile,
  isEditingAddress,
  savingAddress,
  addressForm,
  onEditClick,
  onSaveAddress,
  onCancelEditing,
  onUpdateAddressForm
}: AddressSectionProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold mb-2">Alamat Pengiriman</h3>
          {!isEditingAddress && (
            <button
              type="button"
              className="text-sm text-primary underline flex items-center gap-1"
              onClick={onEditClick}
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {!isEditingAddress ? (
          <div className="text-sm text-muted-foreground">
            <div>{profile?.full_name}</div>
            <div>{profile?.phone}</div>
            <div>{profile?.address}</div>
            <div>{profile?.city}, {profile?.province} {profile?.postal_code}</div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Nama Penerima
              </label>
              <Input
                className="h-11 border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-base"
                value={addressForm.full_name}
                onChange={e => onUpdateAddressForm({ full_name: e.target.value })}
                placeholder="Nama lengkap sesuai pengiriman"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                No. Telepon
              </label>
              <Input
                className="h-11 border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-base"
                value={addressForm.phone}
                onChange={e => onUpdateAddressForm({ phone: e.target.value })}
                placeholder="Nomor HP/WA"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Alamat
              </label>
              <Input
                className="h-11 border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-base"
                value={addressForm.address}
                onChange={e => onUpdateAddressForm({ address: e.target.value })}
                placeholder="Jalan, RT/RW, No. Rumah, dll."
              />
            </div>

            <div>
              <AddressSelectors
                province={addressForm.province}
                setProvince={(v: string) => onUpdateAddressForm({
                  province: v,
                  city: '',
                  district: '',
                  subdistrict: '',
                  postal_code: ''
                })}
                city={addressForm.city}
                setCity={(v: string) => onUpdateAddressForm({
                  city: v,
                  district: '',
                  subdistrict: '',
                  postal_code: ''
                })}
                district={addressForm.district}
                setDistrict={(v: string) => onUpdateAddressForm({
                  district: v,
                  subdistrict: '',
                  postal_code: ''
                })}
                subdistrict={addressForm.subdistrict}
                setSubdistrict={(v: string) => onUpdateAddressForm({ subdistrict: v })}
                postalCode={addressForm.postal_code}
                setPostalCode={(v: string) => onUpdateAddressForm({ postal_code: v })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                disabled={savingAddress}
                onClick={onSaveAddress}
              >
                {savingAddress ? 'Menyimpan...' : 'Simpan ke Profil'}
              </Button>

              <button
                type="button"
                className="px-3 py-1 rounded border"
                onClick={onCancelEditing}
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
