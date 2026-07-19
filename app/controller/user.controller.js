const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { uploadFileOnCloudinary } = require('../utils/file.upload.on.cloudinary');

class UserController {
    // Create a new user
    async createUser(req, res) {
        try {
            console.log("req.body : ", req.body);
            const { name, email, phone, department, profilePicture } = req.body;


            // Check if the user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    status: false,
                    message: 'User already exists'
                });
            }

            const randomPassword = Math.random().toString(36).slice(-6); // Generate a random password
            await sendEmail(req, { name, email, password: randomPassword }); // Send email with the random password
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(randomPassword, salt);


            // Create a new user
            const newUser = new User({
                name,
                email,
                phone,
                department,
                password: hashPassword,
            });

            if (req.file || req.body.profilePicture) {
                newUser.profilePicture = req.file.path
                const cloudinaryResponse = await uploadFileOnCloudinary(req.file.path)
                newUser.profilePicture = cloudinaryResponse.url;
            }
            await newUser.save();

            return res.status(201).json({
                status: true,
                message: 'User created successfully',
                data: newUser
            });
        } catch (error) {
            console.error('Error creating user:', error.message);
            return res.status(500).json({
                status: false,
                message: 'Internal server error in register user'
            });
        }
    }

    async loginUser(req, res) {
        try {
            const { email, password } = req.body;

            // Check if the user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if the password is correct
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid email or password'
                });
            }
            // Generate access token using JWT
            const accesstoken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '10m' });
            const refreshtoken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
            user.refreshToken = refreshtoken;
            user.loggedInTime = new Date();
            await user.save();

            // check first time login
            if (user.isLoggedInFirst) {
                user.isLoggedInFirst = false;
                await user.save();
                // update password to new password
            }

            const cookieName = user.role === 'Admin' ? 'adminToken' : 'userToken';
            res.cookie(cookieName, refreshtoken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                status: true,
                message: 'Login successful',
                data: user,
                token: {
                    accessToken: accesstoken,
                    refreshToken: refreshtoken
                }
            });
        } catch (error) {
            console.error('Error logging in user:', error);
            return res.status(500).json({
                status: false,
                message: 'Internal server error in login user'
            });
        }
    }

    async logoutUser(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }

            // Clear the refresh token from the user document
            user.refreshToken = null;
            await user.save();

            // Clear the cookie
            const cookieName = user.role === 'Admin' ? 'adminToken' : 'userToken';
            res.clearCookie(cookieName, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict'
            });

            return res.status(200).json({
                status: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Error logging out user:', error);
            return res.status(500).json({
                status: false,
                message: 'Internal server error in logout user'
            });
        }
    }
    async resetPasswordLink(req, res) {
        try {
            const { email } = req.body;

            // Check if the user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }

            // Generate token for password reset
            const secret = user._id + process.env.JWT_SECRET;
            const tokenLink = jwt.sign({ userID: user._id }, secret, { expiresIn: '20m' });
            // Reset Link and this link generate by frontend developer
            const resetLink = `${process.env.FRONTEND_HOST}/account/reset-password-confirm/${user._id}/${tokenLink}`;
            //console.log(resetLink);
            // Send password reset email  
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Password Reset Link",
                html: `<p>Hello ${user.name},</p><p>Please <a href="${resetLink}">Click here</a> to reset your password.</p>`
            });
            // Send success response
            res.status(200).json({ status: true, message: "Password reset link sent to your email. Please check your email." });
        } catch (error) {
            console.error('Error sending password reset link:', error);
            return res.status(500).json({
                status: false,
                message: 'Internal server error in sending password reset link'
            });
        }
    }

    async resetPassword(req, res) {
        try {
            const { old_password, new_password, confirm_password } = req.body;
            const { id, token } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(400).json({ status: false, message: "User not found" });
            }

            // Validate token
            const new_secret = user._id + process.env.JWT_SECRET;
            jwt.verify(token, new_secret);

            if (!old_password || !new_password || !confirm_password) {
                return res.status(400).json({ status: false, message: "Old password, new password and confirm password are required" });
            }

            // Check old password correctness
            const isOldPasswordCorrect = await bcrypt.compare(old_password, user.password);
            if (!isOldPasswordCorrect) {
                return res.status(400).json({ status: false, message: "Old password is incorrect" });
            }

            if (new_password !== confirm_password) {
                return res.status(400).json({ status: false, message: "New password and confirm password do not match" });
            }

            const salt = await bcrypt.genSalt(10);
            const newHashPassword = await bcrypt.hash(new_password, salt);

            user.password = newHashPassword;
            await user.save();

            res.status(200).json({ status: true, message: "Password reset successfully" });
        } catch (error) {
            console.error('Error resetting password:', error);
            return res.status(500).json({
                status: false,
                message: 'Internal server error in resetting password'
            });
        }
    }

    async getAllUsers(req, res) {
        try {
            const users = await User.find();
            return res.status(200).json({
                status: true,
                lenngth: users.length,
                message: 'Users retrieved successfully',
                data: users
            });
        } catch (error) {
            console.error('Error retrieving users:', error);
            return res.status(500).json({
                status: false,
                message: 'Internal server error in retrieving users'
            });
        }
    }
    async getUserById(req, res) {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }
            return res.status(200).json({
                status: true,
                message: 'User retrieved successfully',
                data: user
            });
        } catch (error) {
            console.error('Error retrieving user:', error);
            return res.status(500).json({
                status: false,
                message: 'Internal server error in retrieving user'
            });
        }
    }

    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const { name, email, phone, department } = req.body;

            // Find the user by ID
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }

            // Update user fields
            user.name = name || user.name;
            user.email = email || user.email;
            user.phone = phone || user.phone;
            user.department = department || user.department;

            if (req.file || req.body.profilePicture) {
                const cloudinaryResponse = await uploadFileOnCloudinary(req.file.path)
                user.profilePicture = cloudinaryResponse.url;
            }

            await user.save();

            return res.status(200).json({
                status: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            console.error('Error updating user:', error);
            return res.status(500).json({
                status: false,
                message: 'Internal server error in updating user'
            });
        }
    }
    
    async deleteUser(req, res) {
        try {
            const userId = req.params.id;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }

            await user.remove();

            return res.status(200).json({
                status: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({
                status: false,
                message: 'Internal server error in deleting user'
            });
        }
    
    }

    async generateAccessToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ status: false, message: 'Refresh token is required' });
            }
            // Verify the refresh token
            jwt.verify(refreshToken, process.env.JWT_SECRET || 'jwt_secret_key', async (err, decoded) => {
                if (err) {
                    return res.status(401).json({ status: false, message: 'Invalid refresh token error' });
                }
                const user = await User.findById(decoded.id);
                const isRefreshTokenValid = await bcryptjs.compare(refreshToken, user.refreshToken);
                if (!user || !isRefreshTokenValid) {
                    return res.status(401).json({ status: false, message: 'Invalid refresh token user' });
                }
                // Generate a new access token
                const newAccessToken = jwt.sign({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    department: user.department,
                    role: user.role
                }, process.env.JWT_SECRET || 'jwt_secret_key', { expiresIn: '1m' });
                res.status(200).json({
                    status: true,
                    message: 'Access token refreshed successfully',
                    accessToken: newAccessToken
                });
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: 'Server error in refresh token' });
        }
    }
        

    
}

module.exports = new UserController();