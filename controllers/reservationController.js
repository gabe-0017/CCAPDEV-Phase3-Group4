const Reservation = require("../models/reservationSchema");
const User = require("../models/userSchema");

exports.createReservation = async (req, res) => {
  try {
    const { userId, lab, seat, date, time, purpose, lab_tech } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const existingReservation = await Reservation.findOne({ lab, seat, date, time });

    if (existingReservation) {
      return res.status(400).send("Seat already reserved for this time slot.");
    }

    const reservation = new Reservation({
      userId,
      lab,
      seat,
      date,
      time,
      purpose,
      lab_tech,
    });

    await reservation.save();

    res.redirect("/pages/manage.html");
  } catch (error) {
    res.status(500).send("Reservation error.");
  }
};

exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().populate("userId");

    res.json(reservations);
  } catch (error) {
    res.status(500).send("Error retrieving reservations.");
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    await Reservation.findByIdAndDelete(id);

    res.send("Reservation cancelled.");
  } catch (error) {
    res.status(500).send("Error cancelling reservation.");
  }
};

exports.editReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = req.body;

    await Reservation.findByIdAndUpdate(id, updatedData);

    res.send("Reservation updated.");
  } catch (error) {
    res.status(500).send("Error updating reservation.");
  }
};
