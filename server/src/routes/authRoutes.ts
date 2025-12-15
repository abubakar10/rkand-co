import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { env } from "../config/env";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.post(
  "/register",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").optional().isIn(["admin", "manager", "accountant", "viewer"]),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(409).json({ message: "Email already used" });

    const user = new User(req.body);
    await user.save();
    res.status(201).json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } });
  }
);

router.post("/login", [body("email").isEmail(), body("password").isString()], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const valid = await user.comparePassword(req.body.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: "7d" });
  res
    .cookie("token", token, { httpOnly: true, sameSite: "lax" })
    .json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }, token });
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ user: { id: req.user?._id.toString(), name: req.user?.name, email: req.user?.email, role: req.user?.role } });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token").json({ message: "Logged out" });
});

export default router;

