import mongoose, { Schema, Model } from "mongoose";

export interface IInvoice {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  ridaId: mongoose.Types.ObjectId;
  quantity: number;
  customer: string;
  reseller: string;
  amount: number;
  profit: number;
  address?: string;
  isAddressPrinted: boolean;
  addressPrintedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    invoiceNumber: { type: String, required: true },
    ridaId: { type: Schema.Types.ObjectId, ref: "Rida", required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    customer: { type: String, required: true },
    reseller: { type: String, required: true },
    amount: { type: Number, required: true },
    profit: { type: Number, required: true, default: 0 },
    address: { type: String },
    isAddressPrinted: { type: Boolean, default: false },
    addressPrintedAt: { type: Date },
  },
  { timestamps: true }
);

InvoiceSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ userId: 1, customer: 1 });
InvoiceSchema.index({ userId: 1, reseller: 1 });
InvoiceSchema.index({ userId: 1, ridaId: 1 });
InvoiceSchema.index({ userId: 1, isAddressPrinted: 1 });
InvoiceSchema.index({ userId: 1, createdAt: 1 });

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ?? mongoose.model<IInvoice>("Invoice", InvoiceSchema);

