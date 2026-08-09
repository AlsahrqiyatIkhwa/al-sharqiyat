export interface ProductImage {
  id: number;
  imageUrl: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  productId: number;
  size: string;
  colorName: string;
  colorHex?: string | null;
  sku: string;
  stockQuantity: number;
  priceOverride?: string | null;
}

export interface Product {
  id: number;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  descriptionAr?: string | null;
  category: string;
  basePrice: string;
  discountPrice?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

export type Governorate =
  | 'AMMAN'
  | 'ZARQA'
  | 'IRBID'
  | 'AQABA'
  | 'BALQA'
  | 'MADABA'
  | 'MAFRAQ'
  | 'JERASH'
  | 'AJLOUN'
  | 'KARAK'
  | 'TAFILEH'
  | 'MAAN';

export interface ShippingZone {
  id: number;
  governorate: Governorate;
  shippingFee: string;
  estimatedDays: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';
export type PaymentMethod = 'COD' | 'MANUAL_TRANSFER' | 'ORANGE_MONEY';
export type PaymentStatus = 'PENDING' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'FAILED';

export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  productName: string;
  size: string;
  colorName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface Order {
  id: number;
  orderCode: string;
  firstName: string;
  lastName: string;
  customerPhone: string;
  governorate: Governorate;
  area: string;
  street: string;
  buildingNumber: string;
  landmark?: string | null;
  subtotal: string;
  shippingFee: string;
  total: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  depositAmount?: string | null;
  depositTransactionRef?: string | null;
  depositPhoneNumber?: string | null;
  depositVerifiedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface CartLine {
  variantId: number;
  productSlug: string;
  productName: string;
  size: string;
  colorName: string;
  colorHex?: string | null;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  maxStock: number;
  // Optional free-text color request from the customer, for when they'd
  // like a color that isn't one of the product's predefined swatches.
  // This is carried through to the order notes at checkout.
  customColorNote?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface WishlistItem {
  id: number;
  deviceId: string;
  productId: number;
  createdAt: string;
  product: Product;
}

export interface PaymentInstructions {
  COD: {
    label: string;
    description: string;
  };
  ORANGE_MONEY: {
    label: string;
    merchantNumber: string;
    merchantName: string;
    instructions: string;
  };
  MANUAL_TRANSFER: {
    label: string;
    receiverName: string;
    country: string;
    instructions: string;
    bankTransferDetails: string | null;
  };
}
