const Laboratory = require("../models/labSchema");
const User = require("../models/userSchema");



exports.getLabs = async (req, res) => {
    try {

        const labs = await Laboratory.find().populate("lab_tech");

        res.json(labs);

    } catch (error) {
        res.status(500).send("Error retrieving laboratories.");
    }
};



exports.createLab = async (req, res) => {
    try {

        const { name, capacity, lab_tech } = req.body;

        const technician = await User.findById(lab_tech);

        if (!technician || technician.role !== "Lab Technician") {
            return res.status(400).send("Assigned user is not a Lab Technician.");
        }

        const newLab = new Laboratory({
            name,
            capacity,
            lab_tech
        });

        await newLab.save();

        res.redirect("/pages/labs.html");

    } catch (error) {
        res.status(500).send("Error creating laboratory.");
    }
};
