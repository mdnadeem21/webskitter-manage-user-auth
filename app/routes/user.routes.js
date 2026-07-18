const express = require('express');
const router = express.Router();
const UserController = require('../controller/user.controller');
const upload = require('../utils/file.upload.on.cloudinary');
const AuthCheck = require('../middleware/auth.check');
const AdminCheck = require('../middleware/admin.auth.check');


// User registration route
router.post('/register', upload.single('profilePicture'), UserController.createUser);
router.post('/login', UserController.loginUser);
router.put('/update/:id', upload.single('profilePicture'), AuthCheck, UserController.updateUser);
router.delete('/delete/:id', AuthCheck, AdminCheck, UserController.deleteUser);
router.get('/get/:id', AuthCheck, UserController.getUserById);
router.post('/reset-password-link', UserController.resetPasswordLink);
router.post('/reset-password/:id/:token', AuthCheck, UserController.resetPassword);
router.get('/get-all-users', AuthCheck, AdminCheck, UserController.getAllUsers);
router.get('/get-user-by-id/:id', AuthCheck, UserController.getUserById);


module.exports = router;