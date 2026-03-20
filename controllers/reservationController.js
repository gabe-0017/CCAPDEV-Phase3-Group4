const Reservation = require("../models/reservationSchema");
const User = require("../models/userSchema");
const Lab = require("../models/labSchema");

// create a new reservation
exports.createReservation = async (req, res) => {
    try {
        const { userId, lab, seat, date, start_time, end_time, purpose } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).send("User not found.");

        // get lab w/ technician
        const labDoc = await Lab.findById(lab).populate('lab_tech');
        if (!labDoc) return res.status(404).send("Lab not found.");

        // check for overlapping reservation
        const existingReservation = await Reservation.findOne({
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

        const reservation = new Reservation({
            userId,
            lab,
            seat,
            date,
            start_time,
            end_time,
            purpose,
            lab_tech: labDoc.lab_tech._id,
            status: "Pending"
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
// get reservations
exports.getReservations = async (req, res) => {
    try {
        let reservations;
        const LabModel = require("../models/labSchema");
        const labs = await LabModel.find();

        if (req.session.user.role === "Lab Technician" && req.query.userId) {
            // Admin viewing specific student
            return exports.getStudentReservations(req, res);
        } else if (req.session.user.role === "Lab Technician") {
            // Admin sees all reservations
            reservations = await Reservation.find({})
                .populate("userId")
                .populate("lab")
                .sort({ createdAt: -1 });
        } else {
            // Student sees own reservations
            reservations = await Reservation.find({ userId: req.session.user._id })
                .populate("userId")
                .populate("lab")
                .sort({ createdAt: -1 });
        }

        res.render("manage", { 
            reservations, 
            labs, 
            labsJSON: JSON.stringify(labs),
            isAdmin: req.session.user.role === "Lab Technician"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving reservations.");
    }
};

// get a specific student's reservations (for admin's search feature)
exports.getStudentReservations = async (req, res) => {
    try {
        const studentId = req.studentUserId;
        const LabModel = require("../models/labSchema");
        const labs = await LabModel.find();

        const reservations = await Reservation.find({ userId: studentId })
            .populate("userId")
            .populate("lab")
            .sort({ createdAt: -1 });

        const student = await require("../models/userSchema").findById(studentId);

        res.render("manage", { 
            reservations, 
            labs, 
            labsJSON: JSON.stringify(labs),
            isAdmin: true,
            viewingStudent: student.fullname,
            studentId: studentId
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
        return res.json({ success: true });
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

        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating reservation.");
    }
};
