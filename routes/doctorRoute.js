const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Set the upload directory
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Generate unique file names
    },
});

const upload = multer({ storage }); // Initialize multer with storage configuration

router.post('/get-doctor-info-by-user-id', async (req, res) => {
    try {
        const { userId } = req.body;
        const doctor = await Doctor.findOne({ userId });
        if (doctor) {
            res.status(200).send({ success: true, data: doctor });
        } else {
            res.status(404).send({ success: false, message: 'Doctor not found' });
        }
    } catch (error) {
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
});

router.post("/get-doctor-info-by-id", authMiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ _Id: req.body.doctorId });
        res.status(200).send({
            success: true,
            message: "Doctor info fetched successfully",
            data: doctor,
        });
    } catch (error) {
        res.status(500).send({ message: "Error getting doctor info", success: false, error });
    }
});

router.post("/update-doctor-profile",authMiddleware,upload.fields([{ name: "header" }, { name: "footer" }]),
    async (req, res) => {
        try {
            const { firstName, lastName, phoneNumber, address, userId } = req.body;
            const updateData = { firstName, lastName, phoneNumber, address };

            // Include file paths if files are uploaded
            if (req.files?.header) {
                updateData.headerImage = req.files.header[0].path;
            }
            if (req.files?.footer) {
                updateData.footerImage = req.files.footer[0].path;
            }

            const doctor = await Doctor.findOneAndUpdate(
                { userId },
                { $set: updateData },
                { new: true }
            );

            if (!doctor) {
                return res.status(404).send({
                    success: false,
                    message: "Doctor not found for update",
                });
            }

            res.status(200).send({
                success: true,
                message: "Doctor profile updated successfully",
                data: doctor,
            });
        } catch (error) {
            res.status(500).send({
                message: "Error updating doctor profile",
                success: false,
                error,
            });
        }
    }
);


module.exports = router;
