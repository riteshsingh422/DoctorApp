const express = require('express');
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");


const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/register', async (req, res) => {
    try {
        const userExists = await User.findOne({ email: req.body.email });
        if (userExists) {
            return res.status(200).send({ message: "User already exists", success: false });
        }

        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        req.body.password = hashedPassword;

        const newuser = new User(req.body);
        await newuser.save();
        res.status(200).send({ message: "User created successfully", success: true });
    } catch (error) {
        res.status(500).send({ message: "Error creating user", success: false });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(200).send({ message: "User does not exist", success: false });
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(200).send({ message: "Password is incorrect", success: false });
        }
        const payload = { id: user._id, isAdmin: user.isAdmin, isDoctor: user.isDoctor, name: user.name, email: user.email };

        if (user.isDoctor) {
            const doctor = await Doctor.findOne({ userId: user._id.toString() });
            if (doctor) {
                payload.doctorId = doctor._id; 
            }
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).send({ message: "Login Successful", success: true, data: token });
    } catch (error) {
        res.status(500).send({ message: "Error logging in", success: false, error });
    }
});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        if (!user) {
            return res.status(200).send({ message: "User does not exist", success: false });
        }

        user.password = undefined; // Don't send password with user data
        res.status(200).send({ success: true, data: user });
    } catch (error) {
        res.status(500).send({ message: "Error getting user info", success: false });
    }
});

router.post('/doctor-account',authMiddleware, upload.fields([{ name: 'header' }, { name: 'footer' }]), 
    async (req, res) => {
        try {

            const { firstName, lastName, phoneNumber, address, userId } = req.body;

            const header = req.files.header ? req.files.header[0].buffer.toString('base64') : null;
            const footer = req.files.footer ? req.files.footer[0].buffer.toString('base64') : null;

            const newDoctor = new Doctor({
                userId,
                firstName,
                lastName,
                phoneNumber,
                address,
                header,
                footer,
                status: "pending", 
            });

        
            await newDoctor.save();

            const adminUser = await User.findOne({ isAdmin: true });

            const unseenNotification = adminUser.unseenNotification;
            unseenNotification.push({
                type: "new-doctor-request",
                message: `${firstName} ${lastName} has applied for a doctor account`,
                data: {
                    doctorId: newDoctor._id,
                    name: `${firstName} ${lastName}`,
                },
                onClickPath: "/admin/doctorList", 
            });

            await User.findByIdAndUpdate(adminUser._id, { unseenNotification });

            res.status(200).send({
                success: true,
                message: "Doctor account applied successfully",
            });
        } catch (error) {
            res.status(500).send({ message: "Error creating doctor account", success: false });
        }
    }
);

router.post("/mark-all-notification-as-seen", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        const unseenNotification = user.unseenNotification;
        const seenNotification = user.seenNotification;
        seenNotification.push(...unseenNotification);
        user.unseenNotification = [];
        user.seenNotification = seenNotification;
        const updatedUser = await user.save();
        updatedUser.password = undefined;
        res.status(200).send({
            success: true,
            message: "All notification marked as seen",
            data: updatedUser,
        });
    } catch (error) {
        res.status(500).send({
            message: "Error applying doctor account",
            success: false,
            error,
        })
    }
});

router.post("/delete-all-notification", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        user.seenNotification = [];
        user.unseenNotification = [];
        const updatedUser = await user.save();
        updatedUser.password = undefined;
        res.status(200).send({
            success: true,
            message: "All notification Deleted Successfully",
            data: updatedUser,
        });
    } catch (error) {
        res.status(500).send({
            message: "Error deleteing notification",
            success: false,
            error,
        })
    }
});


router.get("/get-all-approved-doctor", authMiddleware, async (req, res) => {
    try {
        let doctors = [];
        if (req.user.isDoctor) {
            doctors = await Doctor.find({ userId: req.user.id.toString() });
        } else if (req.user.isAdmin) {
            doctors = await Doctor.find({ status: "approved" });
        }
        
        res.status(200).send({
            message: "Doctors fetched successfully",
            success: true,
            data: doctors,
        });
    } catch (error) {
        res.status(500).send({
            message: "Error applying doctor account",
            success: false,
            error,
        });
    }
});






module.exports = router;
