import mongoose, { Schema, models } from "mongoose";

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ["new", "read"], default: "new" },
  },
  { timestamps: true },
);

export default models.ContactMessage ||
  mongoose.model("ContactMessage", ContactMessageSchema);
