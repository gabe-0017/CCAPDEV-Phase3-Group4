const mongoose = require("mongoose");

const labSchema = new mongoose.Schema({
    labName: String,
    location: String,
    capacity: Number,
    equipment: [String]
});

module.exports = mongoose.model("Lab", labSchema);
