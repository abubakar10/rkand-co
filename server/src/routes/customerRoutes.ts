import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import { Customer } from "../models/Customer";

const router = Router();

router.use(authenticate);

// Get all customers
router.get("/", async (_req: Request, res: Response) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json({ customers });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

// Create or get customer
router.post(
  "/",
  [body("name").notEmpty().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if customer already exists
      let customer = await Customer.findOne({ name: req.body.name.trim() });
      
      if (!customer) {
        // Create new customer
        customer = await Customer.create({
          name: req.body.name.trim(),
          phone: req.body.phone,
          email: req.body.email,
          address: req.body.address,
        });
      }
      
      res.status(201).json({ customer });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "Customer already exists" });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  }
);

// Search customers
router.get("/search", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res.json({ customers: [] });
  }

  try {
    const customers = await Customer.find({
      name: { $regex: query, $options: "i" },
    })
      .limit(10)
      .sort({ name: 1 });
    res.json({ customers });
  } catch (err) {
    res.status(500).json({ message: "Failed to search customers" });
  }
});

export default router;




