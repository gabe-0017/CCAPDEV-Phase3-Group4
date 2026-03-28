const bcrypt = require('bcryptjs');
const User = require("../models/userSchema");

exports.registerUser = async (req, res) => {
    try {
        const { fullname, email, username, password, role } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const existingEmail = await User.findOne({ email });
        const existingUsername = await User.findOne({ username });

        if (existingEmail || existingUsername) {
            return res.status(400).send("User already exists.");
        }

        const newUser = new User({
            fullname,
            email,
            username,
            password: hashedPassword,
            role
        });

        await newUser.save();

        // Store user in session
        req.session.user = {
            _id: newUser._id,
            username: newUser.username,
            role: newUser.role
        };

        res.redirect("/home");

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send("Error registering user.");
    }
};

exports.loginUser = async (req, res) => {
    try {
        // login debug log 1
        console.log('req.body:', req.body);
        console.log('Username received:', req.body?.username);
        
        const { username, password } = req.body;

        // login debug log 2
        if (!username || !password) {
            console.log('Missing username or password');
            return res.status(400).send("Username and password required.");
        }
        
        console.log(`Login attempt: ${username}`); // login debug log 3
        
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('User not found'); // login debug log 4
            return res.status(400).send("Invalid login credentials.");
        }
        
        console.log(`User found: ${user.username}, pass length: ${user.password.length}`); // login debug log 5
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`bcrypt result: ${isMatch}`); // login debug log 6
        
        if (!isMatch) {
            console.log('Password mismatch'); // login debug log 7
            return res.status(400).send("Invalid login credentials.");
        }
        
        console.log('Login Success!'); // login debug log 8
        
        req.session.user = {
            _id: user._id,
            username: user.username,
            role: user.role
        };
        
        res.redirect("/home");
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Login error.");
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        const newPassword = req.body.newPassword?.trim();
        const confirmPassword = req.body.confirmPassword?.trim();
        
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                return res.status(400).send("Passwords do not match.");
            }
            if (newPassword.length < 6) {
                return res.status(400).send("Password must be at least 6 characters.");
            }
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(newPassword, salt);
        } else {
            // only remove password fields if newPassword is empty
            delete updates.password;
            delete updates.newPassword;
            delete updates.confirmPassword;
        }
        
        await User.findByIdAndUpdate(id, updates);
        req.session.user = { ...req.session.user, ...updates };
        res.redirect(`/profile/${id}`);
    } catch (error) {
        console.error("Profile update error:", error);
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


exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.session.user._id;
        await User.findByIdAndDelete(userId);
        req.session.destroy((err) => {
            if (err) return res.status(500).json({ error: "Error deleting account." });
            res.status(200).json({ message: "Account deleted." });
        });
    } catch (error) {
        res.status(500).json({ error: "Error deleting account." });
    }
};
