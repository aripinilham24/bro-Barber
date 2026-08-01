import { Schema, model, models, Types, type Model } from "mongoose";

export const RESERVATION_STATUS = [
  "PENDING_PAYMENT",
  "DP_PAID",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUS)[number];

export interface ReservationDoc {
  user: Types.ObjectId;
  service: Types.ObjectId;
  timeSlot: Types.ObjectId;
  date: string;
  startTime: string;
  status: ReservationStatus;
  notes: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  dpAmount: number;
  remainingAmount: number;
  voucherCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<ReservationDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    timeSlot: { type: Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    status: {
      type: String,
      enum: RESERVATION_STATUS,
      default: "PENDING_PAYMENT",
      index: true,
    },
    notes: { type: String, default: "", trim: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    dpAmount: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    voucherCode: { type: String, default: null, trim: true, uppercase: true },
  },
  { timestamps: true }
);

// Voucher hanya boleh dipakai SATU KALI per user pada reservasi yang sudah terbayar (DP_PAID / COMPLETED).
reservationSchema.index(
  { user: 1, voucherCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      voucherCode: { $type: "string" },
      status: { $in: ["DP_PAID", "COMPLETED"] },
    },
  }
);

export const ReservationModel: Model<ReservationDoc> =
  (models.Reservation as Model<ReservationDoc>) ||
  model<ReservationDoc>("Reservation", reservationSchema);
