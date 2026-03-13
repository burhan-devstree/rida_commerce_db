import mongoose, { Schema, Model } from "mongoose";

export interface IInvoice {
  _id: mongoose.Types.ObjectId;
  invoiceNumber: string;
  ridaId: mongoose.Types.ObjectId;
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
    invoiceNumber: { type: String, required: true, unique: true },
    ridaId: { type: Schema.Types.ObjectId, ref: "Rida", required: true },
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

InvoiceSchema.index({ customer: 1 });
InvoiceSchema.index({ reseller: 1 });
InvoiceSchema.index({ ridaId: 1 });
InvoiceSchema.index({ isAddressPrinted: 1 });
InvoiceSchema.index({ createdAt: 1 });

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ?? mongoose.model<IInvoice>("Invoice", InvoiceSchema);
