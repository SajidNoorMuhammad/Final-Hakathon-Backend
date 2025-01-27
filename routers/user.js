import express from 'express';
import { User } from '../modals/User.js';
import sendResponse from '../helper/sendResponse.js';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';

const router = express.Router();

const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// User Registration
router.post(
    '/register',
    [
        body('cnic').isLength({ min: 13, max: 13 }).withMessage('CNIC must be 13 characters long'),
        body('email').isEmail().withMessage('Invalid email format'),
        body('name').notEmpty().withMessage('Name is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendResponse(res, 400, false, errors.array(), 'Validation failed');
        }

        const { cnic, email, name } = req.body;

        try {
            const existingUser = await User.findOne({ cnic });
            if (existingUser) {
                return sendResponse(res, 400, true, null, 'User already registered with this CNIC');
            }

            const generatedPassword = generatePassword();
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);

            const user = new User({ cnic, email, name, password: hashedPassword, passwordUpdated: false });
            await user.save();

            sendResponse(res, 201, false, { user, generatedPassword }, 'User Registered Successfully');
        } catch (error) {
            console.error('Error during registration:', error);
            sendResponse(res, 500, true, null, 'Internal server error');
        }
    }
);

// User Login
router.post(
    '/login',
    [
        body('cnic').isLength({ min: 13, max: 13 }).withMessage('CNIC must be 13 characters long'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendResponse(res, 400, false, errors.array(), 'Validation failed');
        }

        const { cnic, password } = req.body;

        try {
            const user = await User.findOne({ cnic });
            if (!user) {
                return sendResponse(res, 400, true, null, 'Invalid CNIC or Password');
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return sendResponse(res, 400, true, null, 'Invalid CNIC or Password');
            }

            if (!user.passwordUpdated) {
                return sendResponse(res, 403, true, null, 'Password update required before proceeding');
            }

            sendResponse(res, 200, false, user, 'Login Successfully Done');
        } catch (error) {
            console.error('Error during login:', error);
            sendResponse(res, 500, true, null, 'Internal server error');
        }
    }
);

// Update Password
router.post('/update-password', async (req, res) => {
    const { cnic, oldPassword, newPassword } = req.body;

    console.log('Request body:', req.body);

    if (!cnic || !oldPassword || !newPassword) {
        return sendResponse(res, 400, true, null, 'Missing required fields');
    }

    try {
        const user = await User.findOne({ cnic });
        console.log('User found:', user);

        if (!user) {
            return sendResponse(res, 404, true, null, 'User not found');
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            return sendResponse(res, 400, true, null, 'Old password is incorrect');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        user.passwordUpdated = true;

        await user.save();
        return sendResponse(res, 200, false, null, 'Password updated successfully');
    } catch (error) {
        console.error('Error during password update:', error);
        sendResponse(res, 500, true, null, 'Internal server error');
    }
});

export default router;
