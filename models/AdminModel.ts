import mongoose, { Schema, models } from "mongoose";

const AdminSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
      unique: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, default: "admin" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const AdminModel =
  models.AdminAccount || mongoose.model("AdminAccount", AdminSchema);
export default AdminModel;
