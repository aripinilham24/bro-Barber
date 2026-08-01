import { Schema, model, models, Types, type Model } from "mongoose";

export const REVIEW_STATUS = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[number];

export interface ReviewDoc {
  reservation: Types.ObjectId | null;
  user: Types.ObjectId;
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
      default: null,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    photoUrl: { type: String, default: "" },
    status: { type: String, enum: REVIEW_STATUS, default: "PENDING", index: true },
  },
  { timestamps: true }
);

// Satu reservasi hanya boleh punya satu ulasan (partial: hanya jika terisi).
reviewSchema.index(
  { reservation: 1 },
  { unique: true, partialFilterExpression: { reservation: { $type: "objectId" } } }
);

export const ReviewModel: Model<ReviewDoc> =
  (models.Review as Model<ReviewDoc>) || model<ReviewDoc>("Review", reviewSchema);
