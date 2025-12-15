import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();

router.use(authenticate, authorize(["admin"]));

router.get("/", async (_req: Request, res: Response) => {
  const users = await User.find({}, "name email role active createdAt");
  res.json({ users });
});

router.post(
  "/",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["admin", "manager", "accountant", "viewer"]),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(409).json({ message: "Email already exists" });
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } });
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

