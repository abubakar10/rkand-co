import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import ledgerRoutes from "./routes/ledgerRoutes";
import customerRoutes from "./routes/customerRoutes";
import supplierRoutes from "./routes/supplierRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// CORS configuration - normalize origin to handle trailing slash issues
const isDevelopment = process.env.NODE_ENV !== 'production';
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Normalize origin by removing trailing slash
    const normalizedOrigin = origin.replace(/\/+$/, '');
    const normalizedClientUrl = env.clientUrl.replace(/\/+$/, '');
    
    // Base list of allowed origins (always includes the configured client URL)
    const allowedOrigins: string[] = [normalizedClientUrl];
    
    // In development, also allow localhost origins
    if (isDevelopment) {
      allowedOrigins.push(
        'http://localhost:5173',  // Vite default dev server
        'http://localhost:3000',  // Common React dev server
        'http://localhost:5174',  // Alternative Vite port
        'http://127.0.0.1:5173',  // Alternative localhost format
        'http://127.0.0.1:3000',
      );
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, normalizedOrigin);
    } else {
      console.warn(`CORS blocked origin: ${normalizedOrigin} (Environment: ${isDevelopment ? 'development' : 'production'})`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => res.json({ status: "ok", name: "RK & Co" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use(errorHandler);

const start = async () => {
  await connectDb();
  
  // Create admin user if it doesn't exist
  try {
    const { User } = await import("./models/User");
    const adminEmail = "admin@rkco.com";
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const admin = new User({
        name: "Admin User",
        email: adminEmail,
        password: "admin123",
        role: "admin",
        active: true,
      });
      await admin.save();
      console.log("✅ Admin user created: admin@rkco.com / admin123");
    }
  } catch (err) {
    console.log("Note: Could not check/create admin user:", err);
  }
  
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

