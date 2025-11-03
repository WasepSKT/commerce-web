/**
 * Product modal component for displaying product details
 */

import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { AboutProduct } from '@/data/aboutProducts';
import { formatPrice } from '@/utils/format';
import { CAROUSEL_CONFIG } from '@/constants/about';
import useCart from '@/hooks/useCart';

interface ProductModalProps {
  product: AboutProduct;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const navigate = useNavigate();
  const { add } = useCart();

  if (!isOpen) return null;

  const handleAddToCart = () => {
    add(product.id, 1);
    onClose();
    navigate('/products');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-white/95 rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-2xl z-10 overflow-auto transform transition-all duration-200">
        <button
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          <div className="w-full lg:w-1/2 flex items-center justify-center bg-transparent">
            <img
              src={product.img}
              alt={product.title}
              className="max-h-[420px] object-contain rounded-lg"
              style={{ maxHeight: `${CAROUSEL_CONFIG.modalImageMaxHeight}px` }}
            />
          </div>
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <h3 className="text-3xl font-extrabold text-brand mb-2">{product.title}</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
              <span className="text-sm text-muted-foreground">/ pack</span>
            </div>
            <p className="text-muted-foreground mb-4">{product.description}</p>

            {Array.isArray(product.benefits) && product.benefits.length > 0 && (
              <ul className="mb-4 space-y-2">
                {product.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="text-green-600 mt-1">✔</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-3 mt-2">
              <button
                className="rounded-full bg-[#7A1316] text-white px-5 py-2 text-sm font-medium shadow"
                onClick={handleAddToCart}
              >
                Belanja Sekarang
              </button>
              <button
                className="rounded-full border border-[#7A1316] text-[#7A1316] px-4 py-2 text-sm"
                onClick={onClose}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

