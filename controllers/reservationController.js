const Reservation = require("../models/reservationSchema");
const User = require("../models/userSchema");
const Lab = require("../models/labSchema");

// create a new reservation
exports.createReservation = async (req, res) => {
    try {
        const { userId, lab, seat, date, start_time, end_time, purpose } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).send("User not found.");

        // check for overlapping reservation
        const existingReservation = await Reservation.findOne({
            lab,
            seat,
            date,
            status: { $ne: "Cancelled" },
            $or: [
                { start_time: { $lt: end_time }, end_time: { $gt: start_time } } // overlapping range
            ]
        });

        if (existingReservation) {
            return res.status(400).send("Seat already reserved for this time range.");
        }

        const reservation = new Reservation({
            userId,
            lab,
            seat,
            date,
            start_time,
            end_time,
            purpose
        });

        await reservation.save();

        user.reservations.push(reservation._id);
        await user.save();

        res.redirect("/manage");
    } catch (error) {
        console.error(error);
        res.status(500).send("Reservation error.");
    }
};

// get all reservations
exports.getReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.session.user._id })
            .populate("userId")
            .populate("lab");

        const labs = await Lab.find();

        res.render("manage", { 
            reservations, 
            labs, 
            labsJSON: JSON.stringify(labs)
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving reservations.");
    }
};

// cancel a reservation
exports.cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        await Reservation.findByIdAndUpdate(id, { status: "Cancelled" });
        res.redirect("/manage");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error cancelling reservation.");
    }
};

// edit reservation
exports.editReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_time, end_time, seat, lab, date, purpose } = req.body;

        // check for overlapping reservation (on edit)
        const existingReservation = await Reservation.findOne({
            _id: { $ne: id },
            lab,
            seat,
            date,
            status: { $ne: "Cancelled" },
            $or: [
                { start_time: { $lt: end_time }, end_time: { $gt: start_time } }
            ]
        });

        if (existingReservation) {
            return res.status(400).send("Seat already reserved for this time range.");
        }

        await Reservation.findByIdAndUpdate(id, {
            lab,
            seat,
            date,
            start_time,
            end_time,
            purpose
        });

        res.redirect("/manage");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating reservation.");
    }
};
