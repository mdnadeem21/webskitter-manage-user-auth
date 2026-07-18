const  transporter  = require("../config/email.config")
const OtpModel=require('../models/otp.models')

const sendEmail=async(req, { name, email, password })=>{
    // Generate a random 4-digit number
  const otp = Math.floor(1000 + Math.random() * 9000);

  // Save OTP in Database
//   const gg=await new OtpModel({ userId: user._id, otp: otp }).save();
  //console.log('hh',gg);
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "User Registered Successfully - update your system generated password",
    text:"",
    html: `
    <p>Hi ${name},</p>
    <p>Thank you for choosing us. Your account has been created successfully.</p>
    <p>Here are your account details:</p>
    <p>Email : <strong>${email}</strong></p>
    <p>Your system-generated password is: <strong>${password}</strong></p>
    <p>Please use this password to log in to your account and change it after your first login.</p>
    <p>Best regards,<br>Your Company Name</p>
  `
  })

  return otp
}


module.exports=sendEmail