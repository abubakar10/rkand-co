import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();

router.use(authenticate);
router.use(authorize(["admin"]));

router.get("/", async (_req: Request, res: Response) => {
  const users = await User.find({}, "name email role active createdAt");
  res.json({ users });
});

router.post(
  "/",
  [
    body("name").notEmpty().trim().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["admin", "manager", "accountant", "viewer"]).withMessage("Invalid role"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = req.body.email?.toLowerCase().trim();
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      const user = new User({
        name: req.body.name.trim(),
        email: email,
        password: req.body.password,
        role: req.body.role || "viewer",
        active: true,
      });
      
      await user.save();
      
      res.status(201).json({ 
        user: { 
          id: user._id.toString(), 
          name: user.name, 
          email: user.email, 
          role: user.role 
        } 
      });
    } catch (err: any) {
      console.error("Error creating user:", err);
      console.error("Error stack:", err.stack);
      
      // Handle specific MongoDB errors
      if (err.code === 11000) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          message: "Validation error",
          errors: Object.values(err.errors).map((e: any) => e.message)
        });
      }
      
      res.status(500).json({ 
        message: err.message || "Failed to create user"
      });
    }
  }
);

router.patch("/:id/toggle", async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.active = !user.active;
  await user.save();
  res.json({ active: user.active });
});

export default router;

