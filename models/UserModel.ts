import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        phone: {
            type: String,
            unique: true,
            trim: true,
            required: true
        },
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false,
        },
        role: {
            type: String,
            enum: ["user", "owner"],
            default: "user",
        },
        profileImageFileId: { type: String, default: "" },
        profileImage: {
            type: String,
            default: "",
            required:true
        },
        address: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const myUserModel = models.User || mongoose.model("User", UserSchema);

export default myUserModel;
