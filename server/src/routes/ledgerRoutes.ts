import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import { SupplierPurchase } from "../models/SupplierPurchase";
import { CustomerSale } from "../models/CustomerSale";
import { Customer } from "../models/Customer";
import { Supplier } from "../models/Supplier";
import { upload } from "../middleware/upload";
import { generateCustomerPDF, generateSupplierPDF } from "../utils/pdfGenerator";

const router = Router();

router.use(authenticate);

router.get("/purchases", async (_req: Request, res: Response) => {
  const purchases = await SupplierPurchase.find().sort({ date: -1 });
  res.json({ purchases });
});

router.post(
  "/purchases",
  upload.single("depositSlip"),
  [
    body("supplierName").notEmpty().withMessage("Supplier name is required"),
    body("product").isIn(["petrol", "hi-octane", "diesel", "mobile oil", "other"]).withMessage("Invalid product"),
    body("liters").optional().custom((value, { req }) => {
      if (req.body.product === "other") return true;
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        throw new Error("Liters must be a positive number");
      }
      return true;
    }),
    body("ratePerLitre").optional().custom((value, { req }) => {
      if (req.body.product === "other") return true;
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        throw new Error("Rate per litre must be a positive number");
      }
      return true;
    }),
    body("totalAmount").custom((value, { req }) => {
      if (req.body.product === "other") {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          throw new Error("Total amount must be a positive number");
        }
        return true;
      }
      return true;
    }),
    body("paymentStatus").optional().isIn(["paid", "unpaid", "partial"]).withMessage("Invalid payment status"),
    body("paidAmount").optional().custom((value) => {
      if (value === undefined || value === "") return true;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error("Paid amount must be a positive number");
      }
      return true;
    }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Auto-save supplier if it doesn't exist
    const supplierName = req.body.supplierName.trim();
    let supplier = await Supplier.findOne({ name: supplierName });
    if (!supplier) {
      supplier = await Supplier.create({ name: supplierName });
    }
    
    const purchaseData: any = {
      supplierName: supplierName,
      product: req.body.product,
      paymentStatus: req.body.paymentStatus || "unpaid",
      paidAmount: req.body.paidAmount ? parseFloat(req.body.paidAmount) : 0,
      notes: req.body.notes,
    };

    if (req.body.product === "other") {
      purchaseData.totalAmount = parseFloat(req.body.totalAmount);
    } else {
      purchaseData.liters = parseFloat(req.body.liters);
      purchaseData.ratePerLitre = parseFloat(req.body.ratePerLitre);
      purchaseData.totalAmount = parseFloat(req.body.liters) * parseFloat(req.body.ratePerLitre);
    }

    // Validate that paidAmount doesn't exceed totalAmount
    if (purchaseData.paidAmount > purchaseData.totalAmount) {
      return res.status(400).json({ 
        message: `Paid amount (${purchaseData.paidAmount}) cannot exceed total amount (${purchaseData.totalAmount})` 
      });
    }

    if (req.file) {
      purchaseData.depositSlipUrl = `/uploads/${req.file.filename}`;
    }

    const purchase = await SupplierPurchase.create(purchaseData);
    res.status(201).json({ purchase });
  }
);

router.put(
  "/purchases/:id",
  upload.single("depositSlip"),
  [
    body("paymentStatus").optional().isIn(["paid", "unpaid", "partial"]).withMessage("Invalid payment status"),
    body("paidAmount").optional().custom((value) => {
      if (value === undefined || value === "") return true;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error("Paid amount must be a positive number");
      }
      return true;
    }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const purchase = await SupplierPurchase.findById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      const updateData: any = {};
      
      if (req.body.paymentStatus) {
        updateData.paymentStatus = req.body.paymentStatus;
      }
      
      if (req.body.paidAmount !== undefined) {
        const paidAmount = parseFloat(req.body.paidAmount) || 0;
        // Cap paidAmount at totalAmount
        const cappedPaidAmount = Math.min(paidAmount, purchase.totalAmount);
        updateData.paidAmount = cappedPaidAmount;
        
        // Automatically update payment status based on paid amount
        if (cappedPaidAmount >= purchase.totalAmount) {
          updateData.paymentStatus = "paid";
        } else if (cappedPaidAmount > 0) {
          updateData.paymentStatus = "partial";
        } else {
          updateData.paymentStatus = "unpaid";
        }
      }

      if (req.file) {
        updateData.depositSlipUrl = `/uploads/${req.file.filename}`;
      }

      if (req.body.notes !== undefined) {
        updateData.notes = req.body.notes;
      }

      const updatedPurchase = await SupplierPurchase.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json({ purchase: updatedPurchase });
    } catch (err: any) {
      console.error("Error updating purchase:", err);
      res.status(500).json({ message: err.message || "Failed to update purchase" });
    }
  }
);

router.get("/sales", async (_req: Request, res: Response) => {
  const sales = await CustomerSale.find().sort({ date: -1 });
  res.json({ sales });
});

router.post(
  "/sales",
  upload.single("image"),
  [
    body("customerName").notEmpty().withMessage("Customer name is required"),
    body("product").isIn(["petrol", "hi-octane", "diesel", "mobile oil", "other"]).withMessage("Invalid product"),
    body("liters").custom((value, { req }) => {
      if (req.body.product === "other") return true;
      if (value === undefined || value === null || value === "") {
        throw new Error("Liters is required for this product");
      }
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        throw new Error("Liters must be a positive number");
      }
      return true;
    }),
    body("ratePerLitre").custom((value, { req }) => {
      if (req.body.product === "other") return true;
      if (value === undefined || value === null || value === "") {
        throw new Error("Rate per litre is required for this product");
      }
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        throw new Error("Rate per litre must be a positive number");
      }
      return true;
    }),
    body("totalAmount").optional().custom((value, { req }) => {
      if (req.body.product === "other") {
        if (!value || value === "") {
          throw new Error("Total amount is required for 'other' products");
        }
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          throw new Error("Total amount must be a positive number");
        }
        return true;
      }
      return true;
    }),
    body("paymentStatus").optional().isIn(["paid", "unpaid", "partial"]).withMessage("Invalid payment status"),
    body("paidAmount").optional().custom((value) => {
      if (value === undefined || value === "") return true;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error("Paid amount must be a positive number");
      }
      return true;
    }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      // Auto-save customer if it doesn't exist
      const customerName = (req.body.customerName || "").trim();
      if (!customerName) {
        return res.status(400).json({ message: "Customer name is required" });
      }
      
      let customer = await Customer.findOne({ name: customerName });
      if (!customer) {
        customer = await Customer.create({ name: customerName });
      }
      
      const saleData: any = {
        customerName: customerName,
        product: req.body.product,
        paymentStatus: req.body.paymentStatus || "unpaid",
        paidAmount: req.body.paidAmount ? parseFloat(req.body.paidAmount) : 0,
        notes: req.body.notes || "",
      };

      if (req.body.product === "other") {
        if (!req.body.totalAmount) {
          return res.status(400).json({ message: "Total amount is required for 'other' products" });
        }
        saleData.totalAmount = parseFloat(req.body.totalAmount);
      } else {
        if (!req.body.liters || !req.body.ratePerLitre) {
          return res.status(400).json({ message: "Liters and rate per litre are required for this product" });
        }
        saleData.liters = parseFloat(req.body.liters);
        saleData.ratePerLitre = parseFloat(req.body.ratePerLitre);
        saleData.totalAmount = saleData.liters * saleData.ratePerLitre;
      }

      // Validate that paidAmount doesn't exceed totalAmount
      if (saleData.paidAmount > saleData.totalAmount) {
        return res.status(400).json({ 
          message: `Paid amount (${saleData.paidAmount}) cannot exceed total amount (${saleData.totalAmount})` 
        });
      }

      if (req.file) {
        saleData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const sale = await CustomerSale.create(saleData);
      res.status(201).json({ sale });
    } catch (error: any) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: error.message || "Failed to create sale" });
    }
  }
);

router.put(
  "/sales/:id",
  upload.single("image"),
  [
    body("paymentStatus").optional().isIn(["paid", "unpaid", "partial"]).withMessage("Invalid payment status"),
    body("paidAmount").optional().custom((value) => {
      if (value === undefined || value === "") return true;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error("Paid amount must be a positive number");
      }
      return true;
    }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const sale = await CustomerSale.findById(req.params.id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }

      const updateData: any = {};
      
      if (req.body.paymentStatus) {
        updateData.paymentStatus = req.body.paymentStatus;
      }
      
      if (req.body.paidAmount !== undefined) {
        const paidAmount = parseFloat(req.body.paidAmount) || 0;
        // Cap paidAmount at totalAmount
        const cappedPaidAmount = Math.min(paidAmount, sale.totalAmount);
        updateData.paidAmount = cappedPaidAmount;
        
        // Automatically update payment status based on paid amount
        if (cappedPaidAmount >= sale.totalAmount) {
          updateData.paymentStatus = "paid";
        } else if (cappedPaidAmount > 0) {
          updateData.paymentStatus = "partial";
        } else {
          updateData.paymentStatus = "unpaid";
        }
      }

      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      if (req.body.notes !== undefined) {
        updateData.notes = req.body.notes;
      }

      const updatedSale = await CustomerSale.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json({ sale: updatedSale });
    } catch (err: any) {
      console.error("Error updating sale:", err);
      res.status(500).json({ message: err.message || "Failed to update sale" });
    }
  }
);

router.get("/balance", async (_req: Request, res: Response) => {
  const [purchases, sales] = await Promise.all([SupplierPurchase.find(), CustomerSale.find()]);
  const totalPurchase = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const paidToSuppliers = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const receivedFromCustomers = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  res.json({
    totals: {
      purchases: totalPurchase,
      sales: totalSales,
      netReceivable: totalSales - receivedFromCustomers,
      netPayable: totalPurchase - paidToSuppliers,
    },
    counts: { purchases: purchases.length, sales: sales.length },
  });
});

router.get("/customers", async (_req: Request, res: Response) => {
  const sales = await CustomerSale.find().sort({ customerName: 1, date: -1 });
  const customerMap = new Map<string, {
    customerName: string;
    totalOrders: number;
    totalAmount: number;
    totalPaid: number;
    balance: number;
    orders: any[];
  }>();

  sales.forEach((sale) => {
    const name = sale.customerName;
    if (!customerMap.has(name)) {
      customerMap.set(name, {
        customerName: name,
        totalOrders: 0,
        totalAmount: 0,
        totalPaid: 0,
        balance: 0,
        orders: [],
      });
    }
    const customer = customerMap.get(name)!;
    const totalAmount = sale.totalAmount || 0;
    // Cap paidAmount at totalAmount to prevent data inconsistencies
    const paidAmount = Math.min(sale.paidAmount || 0, totalAmount);
    
    customer.totalOrders += 1;
    customer.totalAmount += totalAmount;
    customer.totalPaid += paidAmount;
    customer.orders.push({
      _id: sale._id,
      product: sale.product,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      paymentStatus: sale.paymentStatus,
      date: sale.date,
      imageUrl: sale.imageUrl,
    });
  });

  // Calculate balance for each customer
  customerMap.forEach((customer) => {
    customer.balance = customer.totalAmount - customer.totalPaid;
  });

  const customers = Array.from(customerMap.values());
  res.json({ customers });
});

// Customer payment allocation endpoint - MUST come before /customers/:customerName
router.post(
  "/customers/:customerName/payments",
  [
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),
    body("notes").optional().isString(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const customerName = decodeURIComponent(req.params.customerName || "");
      if (!customerName) {
        return res.status(400).json({ message: "Customer name is required" });
      }

      const paymentAmount = parseFloat(req.body.amount);
      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "Payment amount must be greater than 0" });
      }

      // Get all unpaid/partial orders for this customer, sorted by date (oldest first)
      const orders = await CustomerSale.find({
        customerName,
        $or: [
          { paymentStatus: "unpaid" },
          { paymentStatus: "partial" }
        ]
      }).sort({ date: 1 }); // Oldest first

      if (orders.length === 0) {
        return res.status(400).json({ message: "No unpaid orders found for this customer" });
      }

      let remainingPayment = paymentAmount;
      const allocationResults: Array<{
        orderId: string;
        allocated: number;
        previousPaid: number;
        newPaid: number;
        status: string;
      }> = [];

      // Allocate payment across orders
      for (const order of orders) {
        if (remainingPayment <= 0) break;

        const totalAmount = order.totalAmount || 0;
        const currentPaid = Math.min(order.paidAmount || 0, totalAmount);
        const balance = totalAmount - currentPaid;

        if (balance > 0) {
          const allocation = Math.min(remainingPayment, balance);
          const newPaid = currentPaid + allocation;
          const newStatus = newPaid >= totalAmount ? "paid" : "partial";

          await CustomerSale.findByIdAndUpdate(order._id, {
            paidAmount: newPaid,
            paymentStatus: newStatus,
          });

          allocationResults.push({
            orderId: order._id.toString(),
            allocated: allocation,
            previousPaid: currentPaid,
            newPaid: newPaid,
            status: newStatus,
          });

          remainingPayment -= allocation;
        }
      }

      const allocatedAmount = paymentAmount - remainingPayment;
      
      if (remainingPayment > 0) {
        res.json({
          message: `Payment partially allocated. ${allocatedAmount.toFixed(2)} allocated, ${remainingPayment.toFixed(2)} remaining (exceeds total unpaid balance)`,
          totalPayment: paymentAmount,
          allocatedAmount: allocatedAmount,
          remainingAmount: remainingPayment,
          allocatedOrders: allocationResults.length,
          allocationResults,
          warning: true,
        });
      } else {
        res.json({
          message: "Payment allocated successfully",
          totalPayment: paymentAmount,
          allocatedAmount: paymentAmount,
          allocatedOrders: allocationResults.length,
          allocationResults,
        });
      }
    } catch (err: any) {
      console.error("Error allocating customer payment:", err);
      res.status(500).json({ message: err.message || "Failed to allocate payment" });
    }
  }
);

// Customer PDF download endpoint - MUST come before /customers/:customerName
router.get("/customers/:customerName/pdf", async (req: Request, res: Response) => {
  try {
    const customerName = decodeURIComponent(req.params.customerName || "");
    if (!customerName) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const sales = await CustomerSale.find({ customerName }).sort({ date: 1 }); // Oldest first for PDF
    
    if (sales.length === 0) {
      return res.status(404).json({ message: "No orders found for this customer" });
    }

    const totalOrders = sales.length;
    const totalAmount = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalPaid = sales.reduce((sum, s) => {
      const saleTotal = s.totalAmount || 0;
      const salePaid = Math.min(s.paidAmount || 0, saleTotal);
      return sum + salePaid;
    }, 0);
    const balance = totalAmount - totalPaid;

    // Map orders for PDF
    const orders = sales.map(sale => {
      const saleTotal = sale.totalAmount || 0;
      const salePaid = Math.min(sale.paidAmount || 0, saleTotal);
      const orderItem: {
        date: Date;
        product: string;
        liters?: number;
        ratePerLitre?: number;
        totalAmount: number;
        paidAmount: number;
        balance: number;
        paymentStatus: string;
      } = {
        date: sale.date,
        product: sale.product,
        totalAmount: saleTotal,
        paidAmount: salePaid,
        balance: saleTotal - salePaid,
        paymentStatus: sale.paymentStatus,
      };
      if (sale.liters !== undefined) {
        orderItem.liters = sale.liters;
      }
      if (sale.ratePerLitre !== undefined) {
        orderItem.ratePerLitre = sale.ratePerLitre;
      }
      return orderItem;
    });

    const summary = {
      totalOrders,
      totalAmount,
      totalPaid,
      balance,
    };

    const pdfBuffer = await generateCustomerPDF(customerName, orders, summary);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${customerName.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Error generating customer PDF:", err);
    res.status(500).json({ message: err.message || "Failed to generate PDF" });
  }
});

router.get("/customers/:customerName", async (req: Request, res: Response) => {
  const customerName = decodeURIComponent(req.params.customerName || "");
  if (!customerName) {
    return res.status(400).json({ message: "Customer name is required" });
  }
  const sales = await CustomerSale.find({ customerName }).sort({ date: -1 });
  
  const totalOrders = sales.length;
  // Cap paidAmount at totalAmount for each sale to prevent data inconsistencies
  const totalAmount = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalPaid = sales.reduce((sum, s) => {
    const saleTotal = s.totalAmount || 0;
    const salePaid = Math.min(s.paidAmount || 0, saleTotal);
    return sum + salePaid;
  }, 0);
  const balance = totalAmount - totalPaid;

  // Map orders with corrected paidAmount
  const orders = sales.map(sale => ({
    _id: sale._id,
    product: sale.product,
    totalAmount: sale.totalAmount || 0,
    paidAmount: Math.min(sale.paidAmount || 0, sale.totalAmount || 0),
    paymentStatus: sale.paymentStatus,
    date: sale.date,
    imageUrl: sale.imageUrl,
  }));

  res.json({
    customerName,
    totalOrders,
    totalAmount,
    totalPaid,
    balance,
    orders,
  });
});

// Supplier reports endpoints
router.get("/suppliers", async (_req: Request, res: Response) => {
  const purchases = await SupplierPurchase.find().sort({ supplierName: 1, date: -1 });
  const supplierMap = new Map<string, {
    supplierName: string;
    totalOrders: number;
    totalAmount: number;
    totalPaid: number;
    balance: number;
    orders: any[];
  }>();

  purchases.forEach((purchase) => {
    const name = purchase.supplierName;
    if (!supplierMap.has(name)) {
      supplierMap.set(name, {
        supplierName: name,
        totalOrders: 0,
        totalAmount: 0,
        totalPaid: 0,
        balance: 0,
        orders: [],
      });
    }
    const supplier = supplierMap.get(name)!;
    const totalAmount = purchase.totalAmount || 0;
    // Cap paidAmount at totalAmount to prevent data inconsistencies
    const paidAmount = Math.min(purchase.paidAmount || 0, totalAmount);
    
    supplier.totalOrders += 1;
    supplier.totalAmount += totalAmount;
    supplier.totalPaid += paidAmount;
    supplier.orders.push({
      _id: purchase._id,
      product: purchase.product,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      paymentStatus: purchase.paymentStatus,
      date: purchase.date,
      depositSlipUrl: purchase.depositSlipUrl,
    });
  });

  // Calculate balance for each supplier
  supplierMap.forEach((supplier) => {
    supplier.balance = supplier.totalAmount - supplier.totalPaid;
  });

  const suppliers = Array.from(supplierMap.values());
  res.json({ suppliers });
});

// Supplier payment allocation endpoint - MUST come before /suppliers/:supplierName
router.post(
  "/suppliers/:supplierName/payments",
  [
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),
    body("notes").optional().isString(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const supplierName = decodeURIComponent(req.params.supplierName || "");
      if (!supplierName) {
        return res.status(400).json({ message: "Supplier name is required" });
      }

      const paymentAmount = parseFloat(req.body.amount);
      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "Payment amount must be greater than 0" });
      }

      // Get all unpaid/partial orders for this supplier, sorted by date (oldest first)
      const orders = await SupplierPurchase.find({
        supplierName,
        $or: [
          { paymentStatus: "unpaid" },
          { paymentStatus: "partial" }
        ]
      }).sort({ date: 1 }); // Oldest first

      if (orders.length === 0) {
        return res.status(400).json({ message: "No unpaid orders found for this supplier" });
      }

      let remainingPayment = paymentAmount;
      const allocationResults: Array<{
        orderId: string;
        allocated: number;
        previousPaid: number;
        newPaid: number;
        status: string;
      }> = [];

      // Allocate payment across orders
      for (const order of orders) {
        if (remainingPayment <= 0) break;

        const totalAmount = order.totalAmount || 0;
        const currentPaid = Math.min(order.paidAmount || 0, totalAmount);
        const balance = totalAmount - currentPaid;

        if (balance > 0) {
          const allocation = Math.min(remainingPayment, balance);
          const newPaid = currentPaid + allocation;
          const newStatus = newPaid >= totalAmount ? "paid" : "partial";

          await SupplierPurchase.findByIdAndUpdate(order._id, {
            paidAmount: newPaid,
            paymentStatus: newStatus,
          });

          allocationResults.push({
            orderId: order._id.toString(),
            allocated: allocation,
            previousPaid: currentPaid,
            newPaid: newPaid,
            status: newStatus,
          });

          remainingPayment -= allocation;
        }
      }

      const allocatedAmount = paymentAmount - remainingPayment;
      
      if (remainingPayment > 0) {
        res.json({
          message: `Payment partially allocated. ${allocatedAmount.toFixed(2)} allocated, ${remainingPayment.toFixed(2)} remaining (exceeds total unpaid balance)`,
          totalPayment: paymentAmount,
          allocatedAmount: allocatedAmount,
          remainingAmount: remainingPayment,
          allocatedOrders: allocationResults.length,
          allocationResults,
          warning: true,
        });
      } else {
        res.json({
          message: "Payment allocated successfully",
          totalPayment: paymentAmount,
          allocatedAmount: paymentAmount,
          allocatedOrders: allocationResults.length,
          allocationResults,
        });
      }
    } catch (err: any) {
      console.error("Error allocating supplier payment:", err);
      res.status(500).json({ message: err.message || "Failed to allocate payment" });
    }
  }
);

// Supplier PDF download endpoint - MUST come before /suppliers/:supplierName
router.get("/suppliers/:supplierName/pdf", async (req: Request, res: Response) => {
  try {
    const supplierName = decodeURIComponent(req.params.supplierName || "");
    if (!supplierName) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    const purchases = await SupplierPurchase.find({ supplierName }).sort({ date: 1 }); // Oldest first for PDF
    
    if (purchases.length === 0) {
      return res.status(404).json({ message: "No orders found for this supplier" });
    }

    const totalOrders = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalPaid = purchases.reduce((sum, p) => {
      const purchaseTotal = p.totalAmount || 0;
      const purchasePaid = Math.min(p.paidAmount || 0, purchaseTotal);
      return sum + purchasePaid;
    }, 0);
    const balance = totalAmount - totalPaid;

    // Map orders for PDF
    const orders = purchases.map(purchase => {
      const purchaseTotal = purchase.totalAmount || 0;
      const purchasePaid = Math.min(purchase.paidAmount || 0, purchaseTotal);
      const orderItem: {
        date: Date;
        product: string;
        liters?: number;
        ratePerLitre?: number;
        totalAmount: number;
        paidAmount: number;
        balance: number;
        paymentStatus: string;
      } = {
        date: purchase.date,
        product: purchase.product,
        totalAmount: purchaseTotal,
        paidAmount: purchasePaid,
        balance: purchaseTotal - purchasePaid,
        paymentStatus: purchase.paymentStatus,
      };
      if (purchase.liters !== undefined) {
        orderItem.liters = purchase.liters;
      }
      if (purchase.ratePerLitre !== undefined) {
        orderItem.ratePerLitre = purchase.ratePerLitre;
      }
      return orderItem;
    });

    const summary = {
      totalOrders,
      totalAmount,
      totalPaid,
      balance,
    };

    const pdfBuffer = await generateSupplierPDF(supplierName, orders, summary);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${supplierName.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Error generating supplier PDF:", err);
    res.status(500).json({ message: err.message || "Failed to generate PDF" });
  }
});

router.get("/suppliers/:supplierName", async (req: Request, res: Response) => {
  const supplierName = decodeURIComponent(req.params.supplierName || "");
  if (!supplierName) {
    return res.status(400).json({ message: "Supplier name is required" });
  }
  const purchases = await SupplierPurchase.find({ supplierName }).sort({ date: -1 });
  
  const totalOrders = purchases.length;
  // Cap paidAmount at totalAmount for each purchase to prevent data inconsistencies
  const totalAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPaid = purchases.reduce((sum, p) => {
    const purchaseTotal = p.totalAmount || 0;
    const purchasePaid = Math.min(p.paidAmount || 0, purchaseTotal);
    return sum + purchasePaid;
  }, 0);
  const balance = totalAmount - totalPaid;

  // Map orders with corrected paidAmount
  const orders = purchases.map(purchase => ({
    _id: purchase._id,
    product: purchase.product,
    totalAmount: purchase.totalAmount || 0,
    paidAmount: Math.min(purchase.paidAmount || 0, purchase.totalAmount || 0),
    paymentStatus: purchase.paymentStatus,
    date: purchase.date,
    depositSlipUrl: purchase.depositSlipUrl,
  }));

  res.json({
    supplierName,
    totalOrders,
    totalAmount,
    totalPaid,
    balance,
    orders,
  });
});

export default router;

