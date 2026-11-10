import mongoose, { Schema, models } from "mongoose";

const OrderLineSchema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    priceDaily: { type: Number, required: true, min: 1 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    days: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    items: {
      type: [OrderLineSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v.length > 0,
        message: "سفارش باید حداقل یک جنس داشته باشد.",
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "received", "paid"],
      default: "pending",
      index: true,
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    ratedAt: { type: Date, default: null },
    // Each party can hide the order independently.
    hiddenByCustomer: { type: Boolean, default: false },
    hiddenByOwner: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default models.Order || mongoose.model("Order", OrderSchema);
