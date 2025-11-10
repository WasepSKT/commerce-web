interface ProductSpecsProps {
  category: string;
  stock_quantity: number;
  brand?: string | null;
  product_type?: string | null;
  pet_type?: string | null;
  origin_country?: string | null;
  expiry_date?: string | null;
  age_category?: string | null;
}

export const ProductSpecs = ({
  category,
  stock_quantity,
  brand,
  product_type,
  pet_type,
  origin_country,
  expiry_date,
  age_category
}: ProductSpecsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-muted-foreground">Kategori:</span>
        <p className="font-medium">{category}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Stok:</span>
        <p className="font-medium">{stock_quantity} kaleng</p>
      </div>
      <div>
        <span className="text-muted-foreground">Merek:</span>
        <p className="font-medium">{brand ?? '-'}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Jenis Produk:</span>
        <p className="font-medium">{product_type ?? '-'}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Jenis Hewan:</span>
        <p className="font-medium">{pet_type ?? '-'}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Negara Asal:</span>
        <p className="font-medium">{origin_country ?? '-'}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Tanggal Kadaluarsa:</span>
        <p className="font-medium">{expiry_date ?? '-'}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Usia:</span>
        <p className="font-medium">{age_category ?? '-'}</p>
      </div>
    </div>
  );
};


