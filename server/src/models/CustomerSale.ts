import { Schema, model, Document } from "mongoose";
import { ProductKind } from "./Product";
import { PaymentStatus } from "./SupplierPurchase";

export type ExtendedProductKind = ProductKind | "other";

export interface ICustomerSale extends Document {
  customerName: string;
  product: ExtendedProductKind;
  liters?: number;
  ratePerLitre?: number;
  totalAmount: number;
  imageUrl?: string;
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  notes?: string;
  date: Date;
}

const customerSaleSchema = new Schema<ICustomerSale>(
  {
    customerName: { type: String, required: true },
    product: { 
      type: String, 
      enum: ["petrol", "hi-octane", "diesel", "mobile oil", "other"], 
      required: true 
    },
    liters: { 
      type: Number, 
      required: function(this: ICustomerSale) {
        return this.product !== "other";
      }
    },
    ratePerLitre: { 
      type: Number, 
      required: function(this: ICustomerSale) {
        return this.product !== "other";
      }
    },
    totalAmount: { type: Number, required: true },
    imageUrl: String,
    paymentStatus: { type: String, enum: ["paid", "unpaid", "partial"], default: "unpaid" },
    paidAmount: { type: Number, default: 0 },
    notes: String,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CustomerSale = model<ICustomerSale>("CustomerSale", customerSaleSchema);

