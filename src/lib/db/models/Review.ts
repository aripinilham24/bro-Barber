import { Schema, model, models } from "mongoose";

export const REVIEW_STATUS = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[number];

export interface ReviewDoc {
  reservation: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  rating: number;
  comment: string;
  photoUrl: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDoc>(
  {
    reservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    photoUrl: { type: String, default: "" },
    status: { type: String, enum: REVIEW_STATUS, default: "PENDING", index: true },
  },
  { timestamps: true }
);

export const ReviewModel =
  (models.Review as ReturnType<typeof model>) ??
  model<ReviewDoc>("Review", reviewSchema);
