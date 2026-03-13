const Laboratory = require("../models/labSchema");
const User = require("../models/userSchema");

exports.getLabs = async (req, res) => {
    try {

        const labs = await Laboratory.find().populate("lab_tech");

        res.render("labs", { labs });

    } catch (error) {
        res.status(500).send("Error retrieving laboratories.");
    }
};

exports.createLab = async (req, res) => {
    try {

        const { lab, lab_tech } = req.body;

        const technician = await User.findById(lab_tech);

        if (!technician || technician.role !== "Lab Technician") {
            return res.status(400).send("Assigned user is not a Lab Technician.");
        }

        const newLab = new Laboratory({
            lab,
            lab_tech,
            seats: [
                { seatNumber: "A1" }, { seatNumber: "A2" }, { seatNumber: "A3" },
                { seatNumber: "A4" }, { seatNumber: "A5" }, { seatNumber: "A6" },

                { seatNumber: "B1" }, { seatNumber: "B2" }, { seatNumber: "B3" },
                { seatNumber: "B4" }, { seatNumber: "B5" }, { seatNumber: "B6" },

                { seatNumber: "C1" }, { seatNumber: "C2" }, { seatNumber: "C3" },
                { seatNumber: "C4" }, { seatNumber: "C5" }, { seatNumber: "C6" },

                { seatNumber: "D1" }, { seatNumber: "D2" }, { seatNumber: "D3" },
                { seatNumber: "D4" }, { seatNumber: "D5" }, { seatNumber: "D6" },

                { seatNumber: "E1" }, { seatNumber: "E2" }, { seatNumber: "E3" },
                { seatNumber: "E4" }, { seatNumber: "E5" }, { seatNumber: "E6" },

                { seatNumber: "F1" }, { seatNumber: "F2" }, { seatNumber: "F3" },
                { seatNumber: "F4" }, { seatNumber: "F5" }, { seatNumber: "F6" }
            ]
        });

        await newLab.save();

        res.redirect("/labs");

    } catch (error) {
        res.status(500).send("Error creating laboratory.");
    }
};