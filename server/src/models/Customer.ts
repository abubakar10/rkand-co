import { Schema, model, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    phone: String,
    email: String,
    address: String,
  },
  { timestamps: true }
);

export const Customer = model<ICustomer>("Customer", customerSchema);


