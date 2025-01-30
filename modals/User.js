import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    cnic: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    newPasswordٖ:  { type: String, default: null },
    passwordUpdated: { type: Boolean, default: false },
});

export const User = mongoose.model('NewUser', userSchema);
