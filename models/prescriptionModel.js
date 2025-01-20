const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
    },
    prescriptionImage: {
      type: String, // Save as a base64 string
      required: true,
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor', // Reference to the Doctor model
      required: true,
    },
  },
  { timestamps: true }
);

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
