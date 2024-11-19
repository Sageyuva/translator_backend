const userFileModel = require('../models/fileModel');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const secret = process.env.JWT_SECRET;

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// Helper function to extract user ID from token
const extractUserIdFromToken = (token, secretKey) => {
    try {
        const payload = jwt.verify(token, secretKey);
        return payload.userId;
    } catch (error) {
        throw new Error('Invalid token. Please try logging in again.');
    }
};

// Controller: Client file upload
const clientUploadControl = async (req, res) => {
    try {
        console.log('Incoming request:', req.body); // Debug request
        console.log('Uploaded file:', req.file); // Debug file upload

        const { token, fromLanguage, toLanguage } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        if (!token || !fromLanguage || !toLanguage) {
            return res.status(400).json({
                message: 'Missing required fields: token, fromLanguage, or toLanguage.',
            });
        }

        const clientId = extractUserIdFromToken(token, secret);

        const client = await userModel.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        const filePath = path.join('uploads', req.file.filename).replace(/\\/g, '/');

        const newFile = new userFileModel({
            clientname: client.name,
            clientId,
            clientemail: client.email,
            originalFilePath: filePath,
            fromLanguage,
            toLanguage,
        });

        const savedFile = await newFile.save();
        res.status(201).json({
            message: 'File uploaded successfully.',
            file: savedFile,
        });
    } catch (error) {
        console.error('Error in file upload:', error);
        res.status(500).json({
            message: 'Error uploading file.',
            error: error.message,
        });
    }
};

// Controller: Admin updates file with translation
const adminUpdateControl = async (req, res) => {
    try {
        const { fileId } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        if (!fileId) {
            return res.status(400).json({ message: 'File ID is required.' });
        }

        const translatedFilePath = path.join('uploads', req.file.filename).replace(/\\/g, '/');

        const updatedFile = await userFileModel.findByIdAndUpdate(
            fileId,
            {
                translatedFilePath,
                status: 'Completed',
                tat: 'Completed',
            },
            { new: true }
        );

        if (!updatedFile) {
            return res.status(404).json({ message: 'File not found.' });
        }

        res.status(200).json({
            message: 'File updated successfully.',
            file: updatedFile,
        });
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({
            message: 'Error updating file.',
            error: error.message,
        });
    }
};

// Controller: Fetch all files
const fetchAllFilesControl = async (req, res) => {
    try {
        const files = await userFileModel.find({});
        if (!files.length) {
            return res.status(404).json({ message: 'No files found.' });
        }
        res.status(200).json({ message: 'Files fetched successfully.', files });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Error fetching files.', error: error.message });
    }
};

// Controller: Fetch files by user
const fetchFilesByUserControl = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token is not available.' });
        }

        const userId = extractUserIdFromToken(token, secret);

        const files = await userFileModel.find({ clientId: userId });
        if (!files.length) {
            return res.status(404).json({ message: 'No files found for this user.' });
        }

        res.status(200).json({ message: 'Files fetched successfully.', files });
    } catch (error) {
        console.error('Error fetching user files:', error);
        res.status(500).json({ message: 'Error fetching files.', error: error.message });
    }
};

module.exports = {
    fetchFilesByUserControl,
    adminUpdateControl,
    clientUploadControl,
    upload,
    fetchAllFilesControl,
};
