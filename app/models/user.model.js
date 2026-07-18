const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    profilePicture: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
    },
    role: {
        type: String,
        enum: ['Admin', 'User'],
        default: 'User'
    },
    isLoggedInFirst: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String,
        default: null
    },
    loggedInTime: {
        type: Date
    }
},{
    timestamps:true
})

const User = mongoose.model('manage-auth-user',UserSchema)
module.exports = User