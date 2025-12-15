import bcrypt from "bcryptjs";
import { Schema, model, Document, CallbackWithoutResultAndOptionalError } from "mongoose";
import { Role } from "../utils/roles";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
  comparePassword: (candidate: string) => Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "accountant", "viewer"], default: "viewer" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save" as any, async function (next: CallbackWithoutResultAndOptionalError) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);

