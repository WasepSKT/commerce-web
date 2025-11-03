# Migration Best Practices

**Status**: ✅ **SEMUA BEST PRACTICES SUDAH DIIMPLEMENTASI**

---

## ✅ Best Practices Yang Sudah Diterapkan

### 1. **Idempotency** ✅

- ✅ Semua operasi menggunakan `IF EXISTS`, `CREATE OR REPLACE`, `DROP IF EXISTS`
- ✅ Migration bisa dijalankan berkali-kali tanpa error
- ✅ Tidak akan membuat duplicate objects

**Contoh**:

```sql
DROP POLICY IF EXISTS "..." ON table_name;
CREATE OR REPLACE FUNCTION ...
```

---

### 2. **Atomic Transactions** ✅

- ✅ Semua perubahan dalam satu `BEGIN...COMMIT` block
- ✅ Jika ada error, semua perubahan akan di-rollback
- ✅ Database tetap konsisten jika migration gagal

**Contoh**:

```sql
BEGIN;
  -- semua perubahan di sini
COMMIT;
```

---

### 3. **Pre-flight Safety Checks** ✅

- ✅ Validasi dependencies sebelum menjalankan migration
- ✅ Check apakah tabel yang dibutuhkan sudah ada
- ✅ Check apakah function yang dibutuhkan sudah ada
- ✅ Fail fast dengan error message yang jelas

**Contoh**:

```sql
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  -- Check tables exist
  SELECT ARRAY_AGG(table_name) INTO missing_tables
  FROM (VALUES ('profiles'), ('orders')) AS required(tbl)
  WHERE NOT EXISTS (...);

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  END IF;
END $$;
```

---

### 4. **Error Handling** ✅

- ✅ Try-catch untuk operasi yang mungkin gagal
- ✅ Warning untuk masalah non-critical
- ✅ Exception untuk masalah critical yang harus dihentikan

**Contoh**:

```sql
BEGIN
  ALTER TYPE public.user_role ADD VALUE 'marketing';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to add enum value: %', SQLERRM;
END;
```

---

### 5. **Conditional Execution** ✅

- ✅ Check apakah policy/function/trigger sudah ada sebelum modify
- ✅ Tidak akan error jika object tidak ada
- ✅ Idempotent dan safe

**Contoh**:

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = '...'
  ) THEN
    ALTER POLICY "..." ON orders ...;
  END IF;
END $$;
```

---

### 6. **Documentation** ✅

- ✅ Header comment menjelaskan tujuan migration
- ✅ Section comments untuk setiap bagian
- ✅ Inline comments untuk logic yang kompleks
- ✅ Verification queries untuk testing

**Contoh**:

```sql
-- ============================================================
-- SECTION NAME
-- ============================================================
-- Purpose: Explain what this section does
```

---

### 7. **Dependency Management** ✅

- ✅ Pre-flight checks memastikan dependencies ada
- ✅ Warning jika dependency optional tidak ada
- ✅ Exception jika dependency critical tidak ada

---

### 8. **Enum Handling** ✅

- ✅ Check enum type exists sebelum add value
- ✅ Check value sudah ada sebelum add (idempotent)
- ✅ Error handling untuk ALTER TYPE (cannot rollback)

**Contoh**:

```sql
IF NOT EXISTS (
  SELECT 1 FROM pg_enum
  WHERE enumlabel = 'marketing'
  AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
) THEN
  BEGIN
    ALTER TYPE public.user_role ADD VALUE 'marketing';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed: %', SQLERRM;
  END;
END IF;
```

---

## 📋 Checklist Best Practices

| Best Practice            | Status | Implementasi                    |
| ------------------------ | ------ | ------------------------------- |
| ✅ Idempotency           | ✅     | IF EXISTS, CREATE OR REPLACE    |
| ✅ Atomic Transactions   | ✅     | BEGIN...COMMIT                  |
| ✅ Safety Checks         | ✅     | Pre-flight validation           |
| ✅ Error Handling        | ✅     | Try-catch, warnings             |
| ✅ Conditional Execution | ✅     | IF EXISTS checks                |
| ✅ Documentation         | ✅     | Comments & verification queries |
| ✅ Dependency Checks     | ✅     | Pre-flight validation           |
| ✅ Enum Safety           | ✅     | Type & value checks             |

---

## 🎯 Comparison: Before vs After

### **Before (Tidak Best Practice)**

```sql
-- ❌ BAD: No safety checks, will error if policy doesn't exist
ALTER POLICY "Admin access" ON orders
WITH CHECK (...);

-- ❌ BAD: No transaction, partial failures possible
CREATE FUNCTION ...;
CREATE TRIGGER ...;

-- ❌ BAD: Will error if enum doesn't exist
ALTER TYPE user_role ADD VALUE 'marketing';
```

### **After (Best Practice)** ✅

```sql
-- ✅ GOOD: Check exists first, wrapped in transaction
BEGIN;
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'orders' AND policyname = 'Admin access'
    ) THEN
      ALTER POLICY "Admin access" ON orders
      WITH CHECK (...);
    END IF;
  END $$;
COMMIT;

-- ✅ GOOD: Pre-flight checks, error handling
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    RAISE WARNING 'user_role enum not found';
    RETURN;
  END IF;

  IF NOT EXISTS (...) THEN
    BEGIN
      ALTER TYPE user_role ADD VALUE 'marketing';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed: %', SQLERRM;
    END;
  END IF;
END $$;
```

---

## 🚀 Keuntungan Best Practices

1. **✅ Safe to Run Multiple Times**

   - Migration idempotent
   - Tidak akan duplicate objects
   - Aman untuk re-run di CI/CD

2. **✅ Clear Error Messages**

   - Pre-flight checks memberikan error yang jelas
   - Developer tahu apa yang missing
   - Tidak ada cryptic database errors

3. **✅ Atomic & Rollback-Safe**

   - Semua dalam transaction
   - Jika gagal, semua di-rollback
   - Database tetap konsisten

4. **✅ Production-Ready**
   - Tidak akan break production
   - Safe untuk automated deployment
   - Proper error handling

---

## 📝 Recommendations

✅ **Semua best practices sudah diimplementasi!**

Untuk maintenance ke depan:

1. ✅ Gunakan pattern yang sama untuk migration baru
2. ✅ Selalu wrap dalam transaction
3. ✅ Selalu check dependencies
4. ✅ Selalu handle errors gracefully
5. ✅ Selalu dokumentasi dengan jelas

---

**Last Updated**: 2025-11-02  
**Status**: ✅ **PRODUCTION READY**
