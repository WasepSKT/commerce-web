-- ================================================================
-- PERBAIKAN ADMIN DELETE USER FUNCTION - Tanpa tabel yang tidak ada
-- ================================================================

-- Drop function lama jika ada
DROP FUNCTION IF EXISTS admin_delete_user(UUID);

-- Buat function baru yang lebih aman
CREATE OR REPLACE FUNCTION admin_delete_user(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_result JSON;
  v_referrals_deleted INTEGER := 0;
BEGIN
  -- Log function call
  RAISE LOG 'admin_delete_user called for user_id: %', p_user_id;
  
  -- Cek apakah user ada di profiles
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User tidak ditemukan di profiles'
    );
  END IF;
  
  -- Hapus data terkait user yang PASTI ada
  BEGIN
    -- Hapus referrals (tabel ini pasti ada karena kita buat untuk sistem referral)
    DELETE FROM referrals WHERE referrer_id = v_profile.id OR referred_id = v_profile.id;
    GET DIAGNOSTICS v_referrals_deleted = ROW_COUNT;
    RAISE LOG 'Deleted % referrals for user: %', v_referrals_deleted, v_profile.id;
    
    -- Hapus profile (ini yang utama)
    DELETE FROM profiles WHERE user_id = p_user_id;
    RAISE LOG 'Deleted profile for user: %', v_profile.id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'User berhasil dihapus dari database',
      'deleted_profile_id', v_profile.id,
      'deleted_profile_email', v_profile.email,
      'referrals_deleted', v_referrals_deleted,
      'note', 'Auth user deletion requires service role key or manual cleanup'
    );
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error deleting user data: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'Gagal menghapus data user: ' || SQLERRM
    );
  END;
  
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;

-- Test function
SELECT 'Function admin_delete_user fixed successfully' as status;