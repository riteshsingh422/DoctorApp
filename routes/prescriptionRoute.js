const express = require('express');
const router = express.Router();
const Prescription = require('../models/prescriptionModel');
const authMiddleware = require("../middlewares/authMiddleware");
const fs = require("fs");
const path = require("path");
const Doctor = require('../models/doctorModel');  // Ensure the path to your doctor model is correct
const { jsPDF } = require('jspdf');


// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Save Prescription
router.post("/save-prescription", authMiddleware, async (req, res) => {
    try {
        const { prescriptionImage, patientName } = req.body;
        const doctorId = req.user.doctorId; // Extract doctorId from authMiddleware

        if (!doctorId) {
            return res.status(400).send({ message: "Doctor ID is missing", success: false });
        }

        if (!prescriptionImage || !patientName) {
            return res.status(400).send({ message: "Missing required fields", success: false });
        }

        // Save the image to the uploads folder
        const base64Data = prescriptionImage.split(",")[1]; // Remove the `data:image/png;base64,` prefix
        const buffer = Buffer.from(base64Data, "base64");
        const imageName = `${Date.now()}.png`;
        const imagePath = path.join("uploads", imageName); // Relative path for serving
        fs.writeFileSync(path.join(__dirname, "../", imagePath), buffer);

        // Save prescription in the database
        const newPrescription = new Prescription({
            doctor_id: doctorId, // Link prescription to the doctor
            patientName,
            prescriptionImage: imagePath, // Store the relative path of the image
        });

        await newPrescription.save();
        res.status(200).send({ message: "Prescription saved successfully", success: true });
    } catch (error) {
        console.error("Error saving prescription:", error);
        res.status(500).send({ message: "Error saving prescription", success: false });
    }
});

router.get('/get-all-prescriptions', authMiddleware, async (req, res) => {
    try {
        const user = req.user;

        let prescriptions;
        if (user.isAdmin) {
            prescriptions = await Prescription.find().sort({ createdAt: -1 });
        } else {
            prescriptions = await Prescription.find({ doctor_id: user.doctorId }).sort({ createdAt: -1 });
        }

        const baseUrl = req.protocol + "://" + req.get("host");

        const formattedPrescriptions = prescriptions.map((prescription) => ({
            ...prescription._doc,
            prescriptionImage: `${baseUrl}/${prescription.prescriptionImage}`, 
            doctorId: prescription.doctor_id, 
        }));

        res.status(200).send({
            success: true,
            message: 'Prescriptions fetched successfully',
            data: formattedPrescriptions,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Error fetching prescriptions',
            error: error.message,
        });
    }
});


router.get('/download/:id', authMiddleware, async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).send({ success: false, message: 'Prescription not found' });
        }

        const doctor = await Doctor.findById(prescription.doctor_id);
        if (!doctor) {
            return res.status(404).send({ success: false, message: 'Doctor not found' });
        }

        const imagePath = path.join(__dirname, '../', prescription.prescriptionImage);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).send({ success: false, message: 'Prescription image not found' });
        }
        
        const pdf = new jsPDF();
        const imageBuffer = fs.readFileSync(imagePath);
        const imgData = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        if (doctor.header) {
            const headerBuffer = Buffer.from(doctor.header, 'base64'); 
            const headerImgData = `data:image/png;base64,${doctor.header}`;
            pdf.addImage(headerImgData, 'PNG', 0, 0, 210, 30); 
        }

        pdf.addImage(imgData, 'PNG', 10, 40, 190, 100); 

        if (doctor.footer) {
            const footerBuffer = Buffer.from(doctor.footer, 'base64'); 
            const footerImgData = `data:image/png;base64,${doctor.footer}`; 
            const pageHeight = pdf.internal.pageSize.height;
            pdf.addImage(footerImgData, 'PNG', 0, pageHeight - 30, 210, 30);
        }

        const pdfData = pdf.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${prescription.patientName}_prescription.pdf"`
        );
        res.send(Buffer.from(pdfData));
    } catch (error) {
        console.error('Error generating prescription PDF:', error.message);
        res.status(500).send({ success: false, message: 'Error generating prescription PDF', error: error.message });
    }
});


module.exports = router;
