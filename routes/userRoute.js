const express = require('express');
const router = express.Router();
const {sendTranslationNotificationController ,registerController , getAllUsersController,  updateEmailAndNameController , updatePasswordController , deleteAccountController , verifyOtpController , loginController} = require("../controllers/userController")

router.post("/register", registerController);
router.post("/verify-otp", verifyOtpController);
router.post("/login", loginController);
router.delete("/deleteAccount" , deleteAccountController)
router.post("/updatepassword" , updatePasswordController)
router.post("/updateuser" , updateEmailAndNameController)
router.get("/allusers" , getAllUsersController)
router.post('/sendfile' , sendTranslationNotificationController)

module.exports = router;