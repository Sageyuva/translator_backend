const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const userModel = require('../models/userModel'); 
const dotenv = require('dotenv')
const generateToken = require("../jwtUtils")
const jwt = require('jsonwebtoken')
dotenv.config();

const secret = process.env.JWT_SECRET

const registerController = async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await userModel.create({ name, phoneNumber, email, password: hashedPassword });
        const otp = Math.floor(100000 + Math.random() * 900000);  
        newUser.otp = otp;
        await newUser.save();
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.NODEMAILER_MAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });
        const mailOptions = {
            from: 'dhammureyuvaraj@gmail.com',
            to: newUser.email,
            subject: 'Verify your email for registration',
            text: `Your OTP is ${otp}, Please do not share this code with anyone. If you didn’t request this, contact us at [support email/phone number].
            Best regards,
            The GAINtranslator Team`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ error: 'Error sending OTP email' });
            }
            res.status(200).json({
                message: 'Registration successful. Please verify your email using the OTP sent to your email.',
                userId: newUser._id,
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const verifyOtpController = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        user.verified = true;
        user.otp = undefined;
        await user.save();
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'dhammureyuvaraj@gmail.com',
                pass: 'qehi dhdt oiwt fwns',
            },
        });
        const mailOptions = {
            from: 'dhammureyuvaraj@gmail.com',
            to: user.email,
            subject: 'E-mail verification Success',
            text: `Dear ${user.name},
            Thank you! Your email has been successfully verified. You can now enjoy seamless access to all features on GAINtranslator.com.
            Best regards,
            The GAINtranslator Team.`,
        };
        transporter.sendMail(mailOptions, () => {
            res.status(200).json({ message: 'Email successfully verified' })
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const token = generateToken(user._id);
        if (!user.verified) {
            return res.status(403).json({ error: 'Account not verified. Please verify your email.' , token});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const sendTranslationNotificationController = async (req, res) => {
    try {
        const { clientemail, fromLanguage, toLanguage, filePath } = req.body;
        if (!clientemail || !fromLanguage || !toLanguage || !filePath) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.NODEMAILER_MAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.NODEMAILER_MAIL,
            to: clientemail,
            subject: `Document Translation Completed: ${fromLanguage} to ${toLanguage}`,
            text: `Dear Client,
            Your document has been successfully translated from ${fromLanguage} to ${toLanguage}. The translated document is attached below.
            Thank you for using GAINtranslator services.
            Best regards,
            The GAINtranslator Team`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ error: 'Error sending email notification' });
            }
            res.status(200).json({ message: 'Email sent successfully', info });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const extractUserIdFromToken = (token, secretKey) => {
    try {
        const payload =  jwt.verify(token, secretKey);
        return payload.userId;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

const updatePasswordController = async (req, res) => {
    try {
        const { token, oldPassword, newPassword } = req.body;
        const secretKey = process.env.SECRET_KEY;
        const userId = extractUserIdFromToken(token, secretKey);
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Old password is incorrect' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedNewPassword;
        await user.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const updateEmailAndNameController = async (req, res) => {
    try {
        const { token, password, newEmail, newName } = req.body;
        const secretKey = process.env.JWT_SECRET;
        const userId = extractUserIdFromToken(token, secretKey);
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Password is incorrect' });
        }
        if (newEmail) user.email = newEmail;
        if (newName) user.name = newName;
        await user.save();
        res.status(200).json({ message: 'Email and/or name updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const deleteAccountController = async (req, res) => {
    try {
        const { token, password } = await req.body;
        const secretKey = process.env.JWT_SECRET;
        const userId = extractUserIdFromToken(token, secretKey);
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Password is incorrect' });
        }
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.NODEMAILER_MAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });
        const mailOptions = {
            from: 'dhammureyuvaraj@gmail.com',
            to: user.email,
            subject: 'GAINtranslator account deleted',
            text: 'Your GAINtranslator account is deleted successfully',
        };
        await userModel.findByIdAndDelete(userId);
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to send email' });
            }
            res.status(200).json({ message: 'Account deleted successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const getAllUsersController = async (req, res) => {
    try {
        const users = await userModel.find({}, '-password');
        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'No users found' });
        }
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { 
    sendTranslationNotificationController, 
    getAllUsersController, 
    registerController, 
    verifyOtpController, 
    loginController, 
    updateEmailAndNameController, 
    updatePasswordController, 
    deleteAccountController 
};