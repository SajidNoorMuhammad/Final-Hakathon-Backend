import express from 'express';
import { User } from '../modals/User.js';
import sendResponse from '../helper/sendResponse.js';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import Joi from 'joi'
import jwt from 'jsonwebtoken';
import { authenticateUser } from '../middleware/authentication.js';

const router = express.Router();

const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};


const registerSchema = Joi.object({
    cnic: Joi.string()
        .length(13)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            'string.length': 'CNIC must be exactly 13 characters long',
            'string.pattern.base': 'CNIC must contain only numbers',
            'any.required': 'CNIC is required',
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Invalid email format',
            'any.required': 'Email is required',
        }),
    name: Joi.string()
        .min(1)
        .required()
        .messages({
            'string.min': 'Name must be at least 1 character long',
            'any.required': 'Name is required',
        }),
});

router.post('/register', async (req, res) => {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map((detail) => ({
            field: detail.context.key,
            message: detail.message,
        }));
        return sendResponse(res, 400, false, errors, 'Validation failed');
    }

    const { cnic, email, name } = value;

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
});

const schema = Joi.object({
    cnic: Joi.string()
        .length(13)
        // .pattern(/^\d{5}-\d{7}-\d$/) // Ensures CNIC format like "12345-6789012-3"
        .required()
        .messages({
            'string.length': 'CNIC must be exactly 13 characters long',
            'string.pattern.base': 'CNIC must follow the format: 12345-6789012-3',
            'any.required': 'CNIC is required',
        }),
    password: Joi.string()
        .min(8)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'Password is required',
        }),
});

router.get('/myInfo', authenticateUser, async (req, res) => {
    try {
        const user = await User.findOne(
            { _id: req.user._id }
        )

        sendResponse(res, 200, false, user, "User Fetched Successfully")
        if (!user) return sendResponse(res, 400, true, null, "User Not Found")
    }
    catch {
        sendResponse(res, 400, true, null, "Something Went Wrong");
    }

})

router.post(
    '/login',
    async (req, res) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return sendResponse(res, 400, false, error.details, 'Validation failed');
        }

        const { cnic, password } = req.body;

        try {
            const user = await User.findOne({ cnic }).lean();
            if (!user) {
                return sendResponse(res, 400, true, null, 'Invalid CNIC or Password');
            }

            if (user.passwordUpdated === true) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return sendResponse(res, 400, true, null, 'Invalid CNIC or Password');
                }

                if (!user.passwordUpdated) {
                    return sendResponse(res, 403, true, null, 'Password update required before proceeding');
                }

                const token = jwt.sign(user, process.env.AUTH_SECRET);

                sendResponse(res, 200, false, { user, token }, 'Login Successfully Done');
            } else {
                sendResponse(res, 400, true, null, 'Password not updated, please update it first');
            }

        } catch (error) {
            console.error('Error during login:', error);
            sendResponse(res, 500, true, null, 'Internal server error');
        }
    }
);


router.get('/register', async (req, res) => {
    const user = await User.find();
    sendResponse(res, 200, false, user, "User Fetched Successfully")
})

const updatePasswordSchema = Joi.object({
    cnic: Joi.string().required().label("CNIC"), // CNIC is mandatory
    password: Joi.string().min(6).required().label("Old Password"), // Old password is required
    newPassword: Joi.string().min(6).required().label("New Password"), // New password is required
});

router.put("/update-password", async (req, res) => {
    const { cnic, password, newPassword } = req.body;

    // Validate input using Joi schema
    const { error } = updatePasswordSchema.validate({ cnic, password, newPassword });
    if (error) {
        return sendResponse(res, 400, true, null, error.details[0].message);
    }

    try {
        // Find user by CNIC
        const user = await User.findOne({ cnic });
        if (!user) {
            return sendResponse(res, 404, true, null, "User not found");
        }

        // Compare old password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendResponse(res, 400, true, null, "Old password is incorrect");
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedNewPassword;
        user.passwordUpdated = true;

        await user.save();

        return sendResponse(res, 200, false, null, "Password updated successfully");
    } catch (error) {
        console.error("Error during password update:", error);
        return sendResponse(res, 500, true, null, "Internal server error");
    }
});


export default router;
