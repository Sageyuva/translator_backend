const express = require('express');
const router = express.Router();
const {adminUpdateControl, fetchAllFilesControl , fetchFilesByUserControl, clientUploadControl, upload } = require('../controllers/userFileController'); // Correct import

// Define your POST route with the upload middleware
router.post('/upload', upload.single('file'), clientUploadControl);
router.get('/getall' , fetchAllFilesControl);
router.post('/adminUpload' , upload.single('file') , adminUpdateControl)
router.post('/usePosts' , fetchFilesByUserControl)
module.exports = router;
