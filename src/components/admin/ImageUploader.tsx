import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

interface Props {
  value?: File | null;
  previewUrl?: string;
  onChange: (file: File | null, preview?: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function ImageUploader({ value = null, previewUrl = '', onChange, accept = 'image/*', maxSizeMB = 5 }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string>(previewUrl || '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPreview(previewUrl || (value ? URL.createObjectURL(value) : ''));
    return () => {
      // revoke created object URLs when component unmounts or value changes
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, previewUrl]);

  const handleFiles = useCallback((file?: File | null) => {
    if (!file) {
      setPreview('');
      onChange(null, '');
      return;
    }

    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      // simple client-side guard
      alert(`File terlalu besar. Maksimum ${maxSizeMB}MB`);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file, url);
  }, [onChange, maxSizeMB]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFiles(file);
  }, [handleFiles]);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFiles(file);
  }, [handleFiles]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`w-full rounded border-dashed border-2 p-3 flex flex-col items-center justify-center space-y-2 text-center ${dragOver ? 'border-primary bg-primary/5' : 'border-border bg-transparent'}`}>
        {preview ? (
          <div className="relative w-full">
            <img src={preview} alt="preview" className="w-full h-40 object-cover rounded" />
            <button type="button" onClick={() => handleFiles(null)} className="absolute top-2 right-2 inline-flex items-center gap-2 rounded bg-muted/60 p-2 text-muted-foreground">
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 px-4">
            <div className="mb-2 text-sm font-medium">Tarik & lepas gambar di sini</div>
            <div className="text-xs text-muted-foreground">atau</div>
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Pilih file</Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Maks {maxSizeMB}MB • JPG, PNG, WEBP</div>
          </div>
        )}

        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onSelect} />
      </div>
    </div>
  );
}
