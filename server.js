const express = require("express");
const app = express();
const cors = require("cors");
require('dotenv').config()
const dbConfig = require("./config/dbConfig");
app.use(express.json());
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const doctorRoute = require("./routes/doctorRoute");
const prescriptionRoute = require('./routes/prescriptionRoute');
const path = require('path');
const path = require('path')


app.use(cors());

app.use('/api/user', userRoute);
app.use('/api/admin', adminRoute);
app.use('/api/doctor', doctorRoute);
app.use('/api/prescription', prescriptionRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const port = process.env.PORT || 5000;

//static file
app.use(express.static(path.join(__dirname,'./client/build')))

app.get('*', function(req, res){
    res.sendFile(path.join(__dirname, './client/build/index.html'))
})

app.listen(port, () => console.log(`Node Server Started At Port ${port}`));