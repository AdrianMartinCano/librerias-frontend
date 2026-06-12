import { CartItem } from './product.model';

export type PaymentMethod = 'card' | 'transfer' | 'cash-on-delivery';
export type OrderStatus   = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type CheckoutStep  = 'cart' | 'shipping' | 'payment' | 'confirm' | 'success';

export interface ShippingAddress {
  name:       string;
  email:      string;
  phone:      string;
  address:    string;
  city:       string;
  postalCode: string;
  country:    string;
}

export interface OrderRequest {
  items:    CartItem[];
  shipping: ShippingAddress;
  payment:  PaymentMethod;
  total:    number;
}

export interface Order {
  id:           string;
  items:        CartItem[];
  shipping:     ShippingAddress;
  payment:      PaymentMethod;
  total:        number;
  status:       OrderStatus;
  createdAt:    string;
  trackingCode?: string;
}
