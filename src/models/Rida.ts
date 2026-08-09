import mongoose, { Schema, Model } from "mongoose";

export interface IRida {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ridaName: string;
  price: number;
  profit: number;
  ridaImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RidaSchema = new Schema<IRida>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ridaName: { type: String, required: true },
    price: { type: Number, required: true },
    profit: { type: Number, required: true },
    ridaImage: { type: String },
  },
  { timestamps: true }
);

RidaSchema.index({ userId: 1, ridaName: 1 }, { unique: true });

export const Rida: Model<IRida> =
  mongoose.models.Rida ?? mongoose.model<IRida>("Rida", RidaSchema);

