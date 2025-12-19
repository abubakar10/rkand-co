import { Schema, model, Document } from "mongoose";

export type PaymentType = "customer" | "supplier";

export interface IPayment extends Document {
  type: PaymentType;
  customerName?: string;
  supplierName?: string;
  amount: number;
  notes?: string;
  date: Date;
  allocatedOrders: Array<{
    orderId: string;
    allocated: number;
    previousPaid: number;
    newPaid: number;
    status: string;
  }>;
}

const paymentSchema = new Schema<IPayment>(
  {
    type: { type: String, enum: ["customer", "supplier"], required: true },
    customerName: { type: String },
    supplierName: { type: String },
    amount: { type: Number, required: true, min: 0 },
    notes: String,
    date: { type: Date, default: Date.now },
    allocatedOrders: [{
      orderId: { type: String, required: true },
      allocated: { type: Number, required: true },
      previousPaid: { type: Number, required: true },
      newPaid: { type: Number, required: true },
      status: { type: String, required: true },
    }],
  },
  { timestamps: true }
);

// Index for efficient queries
paymentSchema.index({ customerName: 1, date: -1 });
paymentSchema.index({ supplierName: 1, date: -1 });

export const Payment = model<IPayment>("Payment", paymentSchema);

