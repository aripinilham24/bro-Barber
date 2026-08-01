import { Schema, model, models } from "mongoose";

export const SLOT_STATUS = ["AVAILABLE", "BOOKED_PENDING", "BOOKED", "CLOSED"] as const;
export type SlotStatus = (typeof SLOT_STATUS)[number];

export interface TimeSlotDoc {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: SlotStatus;
  lockedUntil: Date | null;
  reservationId: Schema.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const timeSlotSchema = new Schema<TimeSlotDoc>(
  {
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: SLOT_STATUS, default: "AVAILABLE", index: true },
    lockedUntil: { type: Date, default: null },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation", default: null },
  },
  { timestamps: true }
);

// Satu slot unik per tanggal+jam
timeSlotSchema.index({ date: 1, startTime: 1 }, { unique: true });

export const TimeSlotModel =
  (models.TimeSlot as ReturnType<typeof model>) ??
  model<TimeSlotDoc>("TimeSlot", timeSlotSchema);
