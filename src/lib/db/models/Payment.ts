import { Schema, model, models, Types, type Model } from "mongoose";

export const PAYMENT_STATUS = ["PENDING", "PAID", "EXPIRED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const PAYMENT_TYPE = ["DP", "REMAINING", "CASH"] as const;
export type PaymentType = (typeof PAYMENT_TYPE)[number];

export interface PaymentDoc {
  reservation: Types.ObjectId;
  type: PaymentType;
  provider: "simulation" | "xendit" | "cash";
  externalId: string;
  amount: number;
  status: PaymentStatus;
  qrString: string;
  method: "QRIS" | "CASH";
  paidAt: Date | null;
  raw: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDoc>(
  {
    reservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      index: true,
    },
    type: { type: String, enum: PAYMENT_TYPE, required: true },
    provider: {
      type: String,
      enum: ["simulation", "xendit", "cash"],
      default: "simulation",
    },
    externalId: { type: String, unique: true, sparse: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: PAYMENT_STATUS, default: "PENDING", index: true },
    qrString: { type: String, default: "" },
    method: { type: String, enum: ["QRIS", "CASH"], default: "QRIS" },
    paidAt: { type: Date, default: null },
    raw: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const PaymentModel: Model<PaymentDoc> =
  (models.Payment as Model<PaymentDoc>) || model<PaymentDoc>("Payment", paymentSchema);
