const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    lab: String,
    seat: String,
    date: String,
    time: String,
    purpose: String,
    lab_tech: String,
    status: {
        type: String,
        enum: ["Pending", "Approved", "Cancelled"],
        default: "Pending"
    }
});

module.exports = mongoose.model("Reservation", reservationSchema);
