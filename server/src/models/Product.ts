import { Schema, model, Document } from "mongoose";

export type ProductKind = "petrol" | "hi-octane" | "diesel" | "mobile oil";

export interface IProduct extends Document {
  name: ProductKind;
  description?: string;
  baseRate?: number;
  unit: "litre" | "unit";
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      enum: ["petrol", "hi-octane", "diesel", "mobile oil"],
      required: true,
      unique: true,
    },
    description: String,
    baseRate: Number,
    unit: { type: String, enum: ["litre", "unit"], default: "litre" },
  },
  { timestamps: true }
);

export const Product = model<IProduct>("Product", productSchema);





