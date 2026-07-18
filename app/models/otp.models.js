const mongoose=require("mongoose");

// Defining Schema
const otpModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'manage-auth-user', required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '15m' }
});

// Model
const OtpModel = mongoose.model("manage-auth-otp", otpModel);

module.exports= OtpModel;