const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true, 
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        header: {
            type: String,
            required: true,
        },
        footer: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            default: "pending", 
        },
        
    }
);


const doctorModel = mongoose.model("doctors", doctorSchema);


module.exports = doctorModel;
