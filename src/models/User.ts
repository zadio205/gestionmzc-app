import mongoose, { Schema, Document } from "mongoose";
import { User } from "@/types";

interface IUser extends Omit<User, "_id">, Document {
  password: string;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "collaborateur", "client"],
      default: "client",
    },
    clientId: {
      type: String,
      ref: "Client",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
