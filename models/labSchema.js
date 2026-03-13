const mongoose = require("mongoose");

const labSchema = new mongoose.Schema({
    lab: {
        type: String,
        required: true,
        trim: true
    },
    seats: [
        {
            seatNumber: {
                type: String,
                required: true
            },
            status: {
                type: String,
                default: "Available"
            }
        }
    ],
    lab_tech: { // ensured that the user's role = "Lab Technician" in 'labController.js'
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" 
    }
});

module.exports = mongoose.model("Lab", labSchema);
