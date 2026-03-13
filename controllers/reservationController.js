const Reservation = require("../models/reservationSchema");
const User = require("../models/userSchema");
const Lab = require("../models/labSchema");

exports.createReservation = async (req, res) => {
    try {
        const { userId, lab, seat, date, time, purpose } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        const existingReservation = await Reservation.findOne({
            lab,
            seat,
            date,
            time,
            status: { $ne: "Cancelled" }
        });

        if (existingReservation) {
            return res.status(400).send("Seat already reserved for this time.");
        }

        const reservation = new Reservation({
            userId,
            lab,
            seat,
            date,
            time,
            purpose
        });

        await reservation.save();

        user.reservations.push(reservation._id);
        await user.save();

        res.redirect("/manage");
    } catch (error) {
        res.status(500).send("Reservation error.");
    }
};

exports.getReservations = async (req, res) => {

    try {

        const reservations = await Reservation.find({ userId: req.session.user._id })
            .populate("userId")
            .populate("lab");

        res.render("manage", { reservations });

    } catch (error) {

        res.status(500).send("Error retrieving reservations.");

    }

};

exports.cancelReservation = async (req, res) => {

    try {

        const { id } = req.params;

        await Reservation.findByIdAndUpdate(id, {
            status: "Cancelled"
        });

        res.redirect("/manage");

    } catch (error) {

        res.status(500).send("Error cancelling reservation.");

    }

};

exports.editReservation = async (req, res) => {

    try {

        const { id } = req.params;

        await Reservation.findByIdAndUpdate(id, req.body);

        res.redirect("/manage");

    } catch (error) {

        res.status(500).send("Error updating reservation.");

    }

};
