import mongoose, { Schema, models } from "mongoose";

const ShopSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        active: { type: Boolean, default: false },

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

        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

    },
    { timestamps: true }
);

const MyShopModel = models.Shop || mongoose.model("Shop", ShopSchema);

export default MyShopModel;
