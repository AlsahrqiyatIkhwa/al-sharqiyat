'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import { Product } from '@/types';
import { SizeSelector } from './SizeSelector';
import { ColorSwatch } from './ColorSwatch';
import { useCartStore } from '@/lib/cart-store';
import { cn, formatJOD, getImageUrl } from '@/lib/utils';

export function AddToCartPanel({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);

  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size))),
    [product.variants]
  );
  const colors = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    product.variants.forEach((v) => map.set(v.colorName, v.colorHex));
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product.variants]);

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0]?.name ?? null);
  const [quantity, setQuantity] = useState(1);
  // Lets the customer request a color outside the predefined swatches;
  // carried on the cart line and folded into the order notes at checkout.
  const [customColorNote, setCustomColorNote] = useState('');

  const activeVariant = product.variants.find(
    (v) => v.size === selectedSize && v.colorName === selectedColor
  );

  const disabledSizesForColor = sizes.filter((size) => {
    const variant = product.variants.find((v) => v.size === size && v.colorName === selectedColor);
    return !variant || variant.stockQuantity === 0;
  });

  const maxStock = activeVariant?.stockQuantity ?? 0;
  // Mirrors the server's authoritative pricing precedence (order.repository.ts):
  // a variant's own priceOverride wins, then the product's sale price, then base price.
  const hasDiscount =
    product.discountPrice != null && parseFloat(product.discountPrice) < parseFloat(product.basePrice);
  const price = activeVariant?.priceOverride
    ? parseFloat(activeVariant.priceOverride)
    : hasDiscount
      ? parseFloat(product.discountPrice!)
      : parseFloat(product.basePrice);

  function handleAddToCart() {
    if (!activeVariant) {
      toast.error('يرجى اختيار المقاس واللون');
      return;
    }
    if (activeVariant.stockQuantity < quantity) {
      toast.error('الكمية المطلوبة غير متوفرة');
      return;
    }

    const primaryImage = product.images.find((i) => i.isPrimary) || product.images[0];

    addItem({
      variantId: activeVariant.id,
      productSlug: product.slug,
      productName: product.nameAr,
      size: activeVariant.size,
      colorName: activeVariant.colorName,
      colorHex: activeVariant.colorHex,
      unitPrice: price,
      quantity,
      imageUrl: primaryImage ? getImageUrl(primaryImage.imageUrl) : undefined,
      maxStock: activeVariant.stockQuantity,
      customColorNote: customColorNote.trim() || undefined,
    });

    toast.success('تمت الإضافة إلى السلة');
    setQuantity(1);
    setCustomColorNote('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'font-cairo text-3xl font-bold',
            hasDiscount && !activeVariant?.priceOverride ? 'text-red-600' : 'text-ink-900'
          )}
        >
          {formatJOD(price)}
        </span>
        {hasDiscount && !activeVariant?.priceOverride && (
          <span className="text-base text-ink-900/40 line-through">
            {formatJOD(product.basePrice)}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-900">اللون: {selectedColor}</p>
        <ColorSwatch
          colors={colors}
          selected={selectedColor}
          onSelect={(c) => {
            setSelectedColor(c);
            setQuantity(1);
          }}
        />
        <div className="pt-1">
          <label className="text-xs text-ink-900/50">
            تفضلين لوناً غير متوفر بالأعلى؟ اكتبيه هنا وسنحاول تلبية طلبك (اختياري)
          </label>
          <input
            type="text"
            value={customColorNote}
            onChange={(e) => setCustomColorNote(e.target.value)}
            placeholder="مثال: أخضر زيتي"
            maxLength={120}
            className="input-field mt-1.5 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-900">المقاس: {selectedSize}</p>
        <SizeSelector
          sizes={sizes}
          selected={selectedSize}
          onSelect={(s) => {
            setSelectedSize(s);
            setQuantity(1);
          }}
          disabledSizes={disabledSizesForColor}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-900">الكمية</p>
        <div className="flex w-fit items-center gap-4 rounded-full border border-ink-900/15 px-2 py-1">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:bg-ink-900/5 active:scale-75"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center text-sm font-bold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
            disabled={quantity >= maxStock}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:bg-ink-900/5 active:scale-75 disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {activeVariant && (
          <p className="text-xs text-ink-900/50">
            {maxStock > 0 ? `متوفر: ${maxStock} قطعة` : 'نفدت الكمية لهذا الخيار'}
          </p>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleAddToCart}
        disabled={!activeVariant || maxStock === 0}
        className="btn-primary w-full"
      >
        <ShoppingBag className="h-4 w-4" />
        {maxStock === 0 ? 'نفدت الكمية' : 'أضيفي إلى السلة'}
      </motion.button>
    </div>
  );
}
