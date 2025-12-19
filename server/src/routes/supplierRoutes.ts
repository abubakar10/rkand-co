import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import { Supplier } from "../models/Supplier";

const router = Router();

router.use(authenticate);

// Get all suppliers
router.get("/", async (_req: Request, res: Response) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ suppliers });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
});

// Create or get supplier
router.post(
  "/",
  [body("name").notEmpty().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if supplier already exists
      let supplier = await Supplier.findOne({ name: req.body.name.trim() });
      
      if (!supplier) {
        // Create new supplier
        supplier = await Supplier.create({
          name: req.body.name.trim(),
          phone: req.body.phone,
          email: req.body.email,
          address: req.body.address,
        });
      }
      
      res.status(201).json({ supplier });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "Supplier already exists" });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  }
);

// Search suppliers
router.get("/search", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res.json({ suppliers: [] });
  }

  try {
    const suppliers = await Supplier.find({
      name: { $regex: query, $options: "i" },
    })
      .limit(10)
      .sort({ name: 1 });
    res.json({ suppliers });
  } catch (err) {
    res.status(500).json({ message: "Failed to search suppliers" });
  }
});

export default router;



