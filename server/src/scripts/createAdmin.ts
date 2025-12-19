import { connectDb } from "../config/db";
import { User } from "../models/User";

async function createAdmin() {
  try {
    await connectDb();
    console.log("Connected to database");

    const adminEmail = "admin@rkco.com";
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    const admin = await User.create({
      name: "Admin User",
      email: adminEmail,
      password: "admin123",
      role: "admin",
      active: true,
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email:", admin.email);
    console.log("Password: admin123");
    console.log("Role: admin");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();




