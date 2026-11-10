import mongoose, { Schema, models } from "mongoose";

const ItemSchema = new Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    imageFileId: { type: String, default: "" },
    image: {
      type: String,
      required: true,
      trim: true,
    },

    priceDaily: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

const ItemModel =
  models.Item || mongoose.model("Item", ItemSchema);

export default ItemModel;
