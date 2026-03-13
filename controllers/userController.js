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

        res.redirect("/home");

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

        // Store user in session
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role
        };

        res.redirect("/home");
    } catch (error) {
        res.status(500).send("Login error.");
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const User = require("../models/userSchema");
        await User.findByIdAndUpdate(id, req.body);
        res.redirect(`/profile/${id}`);
    } catch (error) {
        res.status(500).send("Error updating profile.");
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
        return res.status(404).send("User not found.");
        }

        res.render("profile", { user });

    } catch (error) {
        res.status(500).send("Error retrieving user.");
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { username } = req.query;

        // find user and populate their reservations
        const users = await User.find({
            username: { $regex: username, $options: "i" }
        }).populate({
            path: 'reservations',
            model: 'Reservation',
            populate: {
                path: 'lab',
                model: 'Lab'
            }
        });

        res.render("adminSearch", { users });
    } catch (error) {
        res.status(500).send("Search error.");
    }
};