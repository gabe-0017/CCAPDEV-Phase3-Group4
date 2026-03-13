const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    lab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lab",
        required: true
    },
    seat: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    start_time: {
        type: String,
        required: true
    },
    end_time: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    lab_tech: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Cancelled"],
        default: "Pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema);
