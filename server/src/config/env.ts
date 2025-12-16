import dotenv from "dotenv";

dotenv.config();

// Normalize URL by removing trailing slash
const normalizeUrl = (url: string): string => {
  return url.replace(/\/+$/, '');
};

export const env = {
  port: process.env.PORT || "5000",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rkco",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  clientUrl: normalizeUrl(process.env.CLIENT_URL || "http://localhost:5173"),
};



