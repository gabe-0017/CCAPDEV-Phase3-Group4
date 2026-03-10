const User = require("../models/userSchema");

exports.registerUser = async (req, res) => {
    try {

        const { fullname, email, username, password, role } = req.body;

        const existingEmail = await User.findOne({ email });
        const existingUsername = await User.findOne({ username });

        if (existingEmail || existingUsername) {
            return res.status(400).send("User already exists.");
        }

        const newUser = new User({
            fullname,
            email,
            username,
            password,
            role
        });

        await newUser.save();

        res.redirect("/pages/home.html");

    } catch (error) {
        res.status(500).send("Error registering user.");
    }
};



exports.loginUser = async (req, res) => {
    try {

        const { username, password } = req.body;

        const user = await User.findOne({ username, password });

        if (!user) {
            return res.status(400).send("Invalid login credentials.");
        }

        res.redirect("/pages/home.html");

    } catch (error) {
        res.status(500).send("Login error.");
    }
};



exports.getUserProfile = async (req, res) => {
    try {

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).send("User not found.");
        }

        res.json(user);

    } catch (error) {
        res.status(500).send("Error retrieving user.");
    }
};



exports.searchUsers = async (req, res) => {
    try {

        const { username } = req.query;

        const users = await User.find({
            username: { $regex: username, $options: "i" }
        });

        res.json(users);

    } catch (error) {
        res.status(500).send("Search error.");
    }
};
