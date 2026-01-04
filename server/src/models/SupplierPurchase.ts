import { Schema, model, Document, Types, CallbackWithoutResultAndOptionalError } from "mongoose";
import { ProductKind } from "./Product";

export type PaymentStatus = "paid" | "unpaid" | "partial";
export type ExtendedProductKind = ProductKind | "other";

export interface ISupplierPurchase extends Document {
  supplierName: string;
  product: ExtendedProductKind;
  liters?: number;
  ratePerLitre?: number;
  totalAmount: number;
  expense?: number; // Additional expenses like vehicle rent, transportation, etc.
  paymentStatus: PaymentStatus;
  depositSlipUrl?: string;
  notes?: string;
  paidAmount?: number;
  date: Date;
}

const supplierPurchaseSchema = new Schema<ISupplierPurchase>(
  {
    supplierName: { type: String, required: true },
    product: { 
      type: String, 
      enum: ["petrol", "hi-octane", "diesel", "mobile oil", "other"], 
      required: true 
    },
    liters: { 
      type: Number, 
      required: function(this: ISupplierPurchase) {
        return this.product !== "other";
      }
    },
    ratePerLitre: { 
      type: Number, 
      required: function(this: ISupplierPurchase) {
        return this.product !== "other";
      }
    },
    totalAmount: { type: Number, required: true },
    expense: { type: Number, default: 0, min: 0 }, // Additional expenses like vehicle rent, transportation, etc.
    paymentStatus: { type: String, enum: ["paid", "unpaid", "partial"], default: "unpaid" },
    depositSlipUrl: String,
    notes: String,
    paidAmount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SupplierPurchase = model<ISupplierPurchase>("SupplierPurchase", supplierPurchaseSchema);


