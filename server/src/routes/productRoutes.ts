import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth";
import { Product } from "../models/Product";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: Request, res: Response) => {
  const products = await Product.find().sort("name");
  res.json({ products });
});

router.post(
  "/",
  [
    body("name").isIn(["petrol", "hi-octane", "diesel", "mobile oil"]),
    body("description").optional().isString(),
    body("baseRate").optional().isNumeric(),
  ],
  authorize(["admin", "manager"]),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const exists = await Product.findOne({ name: req.body.name });
    if (exists) return res.status(409).json({ message: "Product exists" });
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  }
);

export default router;

