import { Schema, model, Document } from "mongoose";

export interface ISupplier extends Document {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    phone: String,
    email: String,
    address: String,
  },
  { timestamps: true }
);

export const Supplier = model<ISupplier>("Supplier", supplierSchema);


