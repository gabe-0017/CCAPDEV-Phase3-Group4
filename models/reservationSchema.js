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
    time: {
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
});

module.exports = mongoose.model("Reservation", reservationSchema);