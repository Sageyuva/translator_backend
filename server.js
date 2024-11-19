const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const app = express()
app.use(express.json())
app.use(cors())
dotenv.config();
const path = require('path');


const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI
        await mongoose.connect(mongoURI)
        console.log("Connected to MongoDB")
    } catch (error) {
        console.error("Error connecting to MongoDB:", error)
        process.exit(1) 
    }
}

connectDB()


const userRoute = require("./routes/userRoute.js");
const userFileController = require("./routes/clientFileRoute.js")


app.use("/user", userRoute);
app.use("/file", userFileController);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post("/admin", (req, res) => {
    try {
        const admin = process.env.ADMIN_KEY;
        const { adminKey } = req.body;

        
        if (adminKey === admin) {
            return res.status(200).send("Admin authenticated successfully");
        } else {
            return res.status(403).send("Forbidden: Invalid admin key");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
});



app.listen(5500, () => {
    console.log("Server running on port 5500")
})
