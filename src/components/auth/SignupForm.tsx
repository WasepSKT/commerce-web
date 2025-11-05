import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/auth/PasswordInput';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import googleLogo from '@/assets/img/Google__G__logo.svg.png';

interface SignupFormProps {
  formData: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    referralCode: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onEmailSignup: () => void;
  onGoogleSignIn: () => void;
  loadingEmail: boolean;
  loadingGoogle: boolean;
  turnstileContainerRef: React.RefObject<HTMLDivElement> | null;
  showTurnstile: boolean;
}

export const SignupForm = ({
  formData,
  onFieldChange,
  onEmailSignup,
  onGoogleSignIn,
  loadingEmail,
  loadingGoogle,
  turnstileContainerRef,
  showTurnstile,
}: SignupFormProps) => {
  return (
    <div className="space-y-4">
      {/* Referral Banner */}
      {formData.referralCode && (
        <div className="p-3 bg-orange-100 rounded-lg text-center border border-orange-200">
          <p className="text-sm text-orange-700">
            🎉 Anda diundang dengan kode: <strong>{formData.referralCode}</strong>
          </p>
        </div>
      )}

      {/* Email Signup Fields */}
      <FormField
        id="fullName"
        label="Nama Lengkap"
        value={formData.fullName}
        onChange={(value) => onFieldChange('fullName', value)}
        placeholder="Masukkan nama lengkap Anda"
      />

      <FormField
        id="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => onFieldChange('email', value)}
        placeholder="Masukkan email Anda"
      />

      <PasswordInput
        id="password"
        label="Password"
        value={formData.password}
        onChange={(value) => onFieldChange('password', value)}
        placeholder="Masukkan password (min. 6 karakter)"
      />

      <PasswordInput
        id="confirmPassword"
        label="Konfirmasi Password"
        value={formData.confirmPassword}
        onChange={(value) => onFieldChange('confirmPassword', value)}
        placeholder="Konfirmasi password Anda"
      />

      <FormField
        id="referral"
        label="Kode Referral (Opsional)"
        value={formData.referralCode}
        onChange={(value) => onFieldChange('referralCode', value)}
        placeholder="Masukkan kode referral"
      />

      {/* Turnstile Widget */}
      {showTurnstile && (
        <div className="flex justify-center w-full">
          <div ref={turnstileContainerRef} className="w-full" />
        </div>
      )}

      {/* Email Signup Button */}
      <Button
        onClick={onEmailSignup}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm py-2"
        size="lg"
        disabled={loadingEmail}
      >
        {loadingEmail && <LoadingSpinner className="h-5 w-5 mr-2 text-white" />}
        {loadingEmail ? 'Mendaftar...' : 'Daftar Sekarang'}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">Atau</span>
        </div>
      </div>

      {/* Google Signup Button */}
      <Button
        onClick={onGoogleSignIn}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-blue-50 text-gray-700 font-semibold shadow-sm py-2"
        size="lg"
        disabled={loadingGoogle}
      >
        {loadingGoogle ? (
          <LoadingSpinner className="h-5 w-5 mr-2 text-blue-500" />
        ) : (
          <img src={googleLogo} alt="Google logo" className="h-5 w-5 mr-2" />
        )}
        {loadingGoogle ? 'Memproses...' : 'Daftar dengan Google'}
      </Button>
    </div>
  );
};

// Helper component for form fields
const FormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-primary font-medium">
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="!border-2 !border-primary focus:!border-primary focus:!ring-2 focus:!ring-primary/20 focus:!ring-offset-0"
    />
  </div>
);
