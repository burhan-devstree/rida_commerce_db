import mongoose, { Schema, Model } from "mongoose";

export interface IRida {
  _id: mongoose.Types.ObjectId;
  ridaName: string;
  price: number;
  profit: number;
  ridaImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RidaSchema = new Schema<IRida>(
  {
    ridaName: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    profit: { type: Number, required: true },
    ridaImage: { type: String },
  },
  { timestamps: true }
);

export const Rida: Model<IRida> =
  mongoose.models.Rida ?? mongoose.model<IRida>("Rida", RidaSchema);
