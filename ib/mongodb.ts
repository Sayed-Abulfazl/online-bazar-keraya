import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGO_URI is not defined. Configure your MongoDB connection string.");
if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) throw new Error("MONGO_URI must be a valid MongoDB connection string.");

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }
  try {
    await mongoose.connect(mongoUri || "", { serverSelectionTimeoutMS: 10000 });
    console.log("----------Connected--------");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}
