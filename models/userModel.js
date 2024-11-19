const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: "string",
    email: "string",
    number: "number",
    password: "string",
    verified: {
        type: Boolean,
        default: false,  
    },
    otp: String,  
}, {
    timestamps: true
});

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
