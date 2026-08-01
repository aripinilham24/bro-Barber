import { Schema, model, models } from "mongoose";

export interface ServiceDoc {
  name: string;
  description: string;
  price: number;
  duration: number; // menit
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<ServiceDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 5 },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ServiceModel =
  (models.Service as ReturnType<typeof model>) ??
  model<ServiceDoc>("Service", serviceSchema);
