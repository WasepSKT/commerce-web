-- ================================================================
-- ADMIN USER DELETE FUNCTION - Jalankan di SQL Editor
-- ================================================================
-- Function untuk menghapus user secara lengkap (Auth + Profile + Related Data)

-- 1. Function untuk admin delete user
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
BEGIN
  -- Log function call
  RAISE LOG 'admin_delete_user called for user_id: %', p_user_id;
  
  -- Cek apakah user ada di profiles
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User tidak ditemukan'
    );
  END IF;
  
  -- Hapus data terkait user secara berurutan (untuk menghindari foreign key constraints)
  BEGIN
    -- Hapus referrals yang terkait (jika tabel ada)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
      DELETE FROM referrals WHERE referrer_id = v_profile.id OR referred_id = v_profile.id;
      RAISE LOG 'Deleted referrals for user: %', v_profile.id;
    END IF;
    
    -- Hapus data cart (jika tabel ada)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_items') THEN
      DELETE FROM cart_items WHERE user_id = v_profile.id;
      RAISE LOG 'Deleted cart items for user: %', v_profile.id;
    END IF;
    
    -- Hapus orders (jika tabel ada)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
      DELETE FROM orders WHERE user_id = v_profile.id;
      RAISE LOG 'Deleted orders for user: %', v_profile.id;
    END IF;
    
    -- Hapus profile
    DELETE FROM profiles WHERE user_id = p_user_id;
    RAISE LOG 'Deleted profile for user: %', v_profile.id;
    
    -- Note: Hapus dari auth.users harus dilakukan di application level
    -- karena RLS dan security constraints
    
    RETURN json_build_object(
      'success', true,
      'message', 'User data berhasil dihapus dari database',
      'deleted_profile_id', v_profile.id,
      'note', 'Auth user harus dihapus dari application level'
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

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;

-- 3. Function untuk cleanup orphaned profiles (profiles tanpa auth user)
CREATE OR REPLACE FUNCTION cleanup_orphaned_profiles()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  -- Hapus profiles yang tidak memiliki corresponding auth user
  -- Note: Ini hanya contoh, di production harus hati-hati
  WITH orphaned AS (
    SELECT p.id, p.user_id 
    FROM profiles p 
    LEFT JOIN auth.users au ON p.user_id = au.id 
    WHERE au.id IS NULL
  )
  DELETE FROM profiles 
  WHERE id IN (SELECT id FROM orphaned);
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE LOG 'Cleaned up % orphaned profiles', v_deleted_count;
  
  RETURN json_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'message', 'Orphaned profiles cleanup completed'
  );
END;
$$;

-- 4. Grant permissions untuk cleanup function
GRANT EXECUTE ON FUNCTION cleanup_orphaned_profiles() TO authenticated;

-- 5. Test functions
SELECT 'Functions created successfully' as status;