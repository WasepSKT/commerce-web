import { Button } from '@/components/ui/button';
import AddressSelectors from '@/components/profile/AddressSelectors';
import { CHECKOUT_MESSAGES } from '@/constants/checkout';

interface AddressFormState {
  full_name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postal_code: string;
}

interface AddressBlockProps {
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  form: AddressFormState;
  setForm: (updater: (prev: AddressFormState) => AddressFormState) => void;
  saving: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
  profile: { full_name?: string | null; phone?: string | null; address?: string | null; city?: string | null; province?: string | null; postal_code?: string | null } | null;
  EditIcon: React.ComponentType<{ className?: string }>;
}

export default function AddressBlock({
  isEditing,
  setIsEditing,
  form,
  setForm,
  saving,
  onSave,
  onCancel,
  profile,
  EditIcon,
}: AddressBlockProps) {
  return (
    <div>
      <div className="flex justify-between items-start">
        <h3 className="font-semibold mb-2 text-primary">{CHECKOUT_MESSAGES.ADDRESS_TITLE}</h3>
        {!isEditing ? (
          <button type="button" className="text-sm text-primary underline flex items-center gap-1" onClick={() => setIsEditing(true)}>
            <EditIcon className="h-4 w-4" />
            {CHECKOUT_MESSAGES.EDIT}
          </button>
        ) : null}
      </div>

      {!isEditing ? (
        <div className="text-sm text-muted-foreground">
          <div>{profile?.full_name}</div>
          <div>{profile?.phone}</div>
          <div>{profile?.address}</div>
          <div>
            {profile?.city}, {profile?.province} {profile?.postal_code}
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Nama Penerima</label>
            <input className="w-full border rounded px-2 py-1" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">No. Telepon</label>
            <input className="w-full border rounded px-2 py-1" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Alamat</label>
            <input className="w-full border rounded px-2 py-1" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div>
            <AddressSelectors
              province={form.province}
              setProvince={(v: string) => setForm((f) => ({ ...f, province: v, city: '', district: '', subdistrict: '', postal_code: '' }))}
              city={form.city}
              setCity={(v: string) => setForm((f) => ({ ...f, city: v, district: '', subdistrict: '', postal_code: '' }))}
              district={form.district}
              setDistrict={(v: string) => setForm((f) => ({ ...f, district: v, subdistrict: '', postal_code: '' }))}
              subdistrict={form.subdistrict}
              setSubdistrict={(v: string) => setForm((f) => ({ ...f, subdistrict: v }))}
              postalCode={form.postal_code}
              setPostalCode={(v: string) => setForm((f) => ({ ...f, postal_code: v }))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button disabled={saving} onClick={onSave}>
              {saving ? 'Menyimpan...' : CHECKOUT_MESSAGES.SAVE_TO_PROFILE}
            </Button>
            <button type="button" className="px-3 py-1 rounded border" onClick={onCancel}>
              {CHECKOUT_MESSAGES.CANCEL}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


