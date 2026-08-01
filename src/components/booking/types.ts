/** Tipe bersama untuk alur booking */

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export interface SlotOption {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AvailabilityDay {
  date: string;
  available: number;
  times: string[];
}

export interface PriceBreakdown {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  dpAmount: number;
  remainingAmount: number;
}

export interface OrderData {
  id: string;
  status: string;
  date: string;
  startTime: string;
  serviceName: string;
  price: PriceBreakdown;
  qrString: string;
  expiresAt: string;
  externalId: string;
}

export interface ReservationDetail {
  _id: string;
  status: string;
  date: string;
  startTime: string;
  notes?: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  dpAmount: number;
  remainingAmount: number;
  voucherCode?: string | null;
  service?: { name: string; price: number; duration: number } | null;
  timeSlot?: { startTime: string; endTime: string; status: string } | null;
  user?: { name: string; email: string; phone?: string } | null;
  createdAt?: string;
}
