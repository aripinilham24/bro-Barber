import { Schema, model, models } from "mongoose";

export interface VoucherDoc {
  code: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const voucherSchema = new Schema<VoucherDoc>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const VoucherModel =
  (models.Voucher as ReturnType<typeof model>) ??
  model<VoucherDoc>("Voucher", voucherSchema);
