const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const session = require("express-session");
const hbs = exphbs.create({
  extname: 'handlebars',
  helpers: { eq: (a, b) => a === b },
  defaultLayout: false
});

const app = express();
const PORT = 3000;

const userController = require("./controllers/userController");
const labController = require("./controllers/labController");
const reservationController = require("./controllers/reservationController");
const Reservation = require("./models/reservationSchema");

mongoose.connect('mongodb://localhost:27017/labreserve')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));

app.engine("handlebars", exphbs.engine({
  extname: "handlebars",
  helpers: { eq: (a, b) => a === b },
  defaultLayout: false,
  partialsDir: path.join(__dirname, "views/modals"),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// user authentication
app.use(session({
    secret: "apdev-mco2-grp4",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// pass user data to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// protect routes
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect("/");
};

// login page render
app.get("/index", (req, res) => {
    res.render("index");
});

// root route (login page)
app.get("/", (req, res) => {
    res.redirect("/index");
});

// general-user routes (student/admin)
app.post("/register", userController.registerUser);
app.post("/login", userController.loginUser);
app.get("/profile/:id", isAuthenticated, userController.getUserProfile);
app.get("/profile", isAuthenticated, (req, res) => {
    res.redirect(`/profile/${req.session.user._id}`);
});
app.post("/profile/:id/update", isAuthenticated, userController.updateUserProfile);
app.get("/register", (req, res) => {
    res.render("register");
});

// admin-user routes (admin-only)
app.get("/adminSearch", isAuthenticated, (req, res) => {
    if (req.session.user.role !== "Lab Technician") {
        return res.redirect("/home");
    }
    res.render("adminSearch");
});
app.post("/adminSearch", isAuthenticated, async (req, res) => {
    if (req.session.user.role !== "Lab Technician") {
        return res.redirect("/home");
    }
    
    try {
        const { email } = req.body;
        const User = require("./models/userSchema");
        
        // console.log("Searching for email:", email); // debug cmd log

        const student = await User.findOne({ 
            $or: [
                { email: email.trim() }, // exact-match
                { email: { $regex: email.trim(), $options: "i" } } // case-insensitive
            ],
            role: "Student" 
        });
        
        // console.log("Found student:", student ? student.email : "NONE"); // debug cmd log
        
        if (!student) {
            return res.render("adminSearch", { error: `No student found with email "${email}".` });
        }
        
        res.redirect(`/manage?userId=${student._id}`);
    } catch (error) {
        // console.error("Admin search error:", error); // debug cmd log
        res.status(500).render("adminSearch", { error: "Search error." });
    }
});

// logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error logging out.");
        }
        res.redirect("/");
    });
});

// delete account route
app.delete("/deleteAccount", isAuthenticated, userController.deleteAccount);

// lab routes
app.get("/labs", isAuthenticated, labController.getLabs);
app.post("/labs/create", isAuthenticated, labController.createLab);
app.get("/labs/:id", isAuthenticated, async (req, res) => {
  try {
    const Lab = require("./models/labSchema");
    const lab = await Lab.findById(req.params.id).populate("lab_tech");
    if (!lab) return res.status(404).json({ error: "Lab not found" });
    res.json(lab);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// reservation routes
app.post("/reserve", isAuthenticated, reservationController.createReservation);
app.get("/reservations", isAuthenticated, reservationController.getReservations);
app.get("/reservations/:id", isAuthenticated, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate({
                path: "userId",
                select: "fullname"
            })
            .populate({
                path: "lab",
                populate: {
                    path: "lab_tech",
                    select: "fullname"
                }
            })
            .populate("lab_tech", "fullname");
        
        if (!reservation) {
            return res.status(404).send("Reservation not found.");
        }
        res.json(reservation);
    } catch (error) {
        res.status(500).send("Error retrieving reservation.");
    }
});
app.delete("/reservations/:id", isAuthenticated, reservationController.cancelReservation);
app.put("/reservations/:id", isAuthenticated, reservationController.editReservation);
app.get("/reservation", isAuthenticated, async (req, res) => {
    const labs = await require("./models/labSchema").find();
    res.render("reservation", { labs });
});
app.get("/manage", isAuthenticated, async (req, res) => {
    try {
        const LabModel = require("./models/labSchema");
        const labs = await LabModel.find();

        let reservations;
        
        // case 1: admin view [specific student (adminSearch feature)]
        if (req.query.userId && req.session.user.role === "Lab Technician") {
            const studentId = req.query.userId;
            reservations = await Reservation.find({ userId: studentId })
                .populate("userId")
                .populate("lab")
                .populate("lab_tech")
                .sort({ createdAt: -1 });

            const student = await require("./models/userSchema").findById(studentId);
            
            return res.render("manage", { 
                reservations, 
                labs, 
                labsJSON: JSON.stringify(labs),
                isAdmin: true,
                viewingStudent: student ? student.fullname : "Unknown Student",
                studentId: studentId
            });
        }
        
        // case 2: Admin view [all reservations]
        if (req.session.user.role === "Lab Technician") {
            reservations = await Reservation.find({})
                .populate("userId")
                .populate("lab")
                .populate("lab_tech")
                .sort({ createdAt: -1 });
        } 
        // case 3 - student view [own reservations]
        else {
            reservations = await Reservation.find({ userId: req.session.user._id })
                .populate("userId")
                .populate("lab")
                .populate("lab_tech")
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
});

// route to home
app.get("/home", isAuthenticated, async (req, res) => {
    const Lab = require("./models/labSchema");
    const Reservation = require("./models/reservationSchema");

    try {
        const labs = await Lab.find();
        const reservations = await Reservation.find().populate("userId");
        res.render("home", { labs, reservations });
    } catch (error) {
        res.status(500).send("Error loading home page.");
    }
});

// seed labs
app.get("/seed-labs", async (req, res) => {
    try {
        const Lab = require("./models/labSchema");
        
        // generate 36 seats per lab
        const generateSeats = () => {
            const seats = [];
            const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
            rows.forEach(row => {
                for (let i = 1; i <= 6; i++) {
                    seats.push({ seatNumber: `${row}${i}` });
                }
            });
            return seats;
        };

        // create 5 labs
        const labs = [
            { lab: "Lab 101 - Programming Laboratory", seats: generateSeats() },
            { lab: "Lab 102 - Networking Laboratory", seats: generateSeats() },
            { lab: "Lab 103 - Cybersecurity Laboratory", seats: generateSeats() },
            { lab: "Lab 104 - Multimedia Laboratory", seats: generateSeats() },
            { lab: "Lab 105 - AI Laboratory", seats: generateSeats() }
        ];
        
        await Lab.deleteMany({});
        await Lab.insertMany(labs);
        
        res.send(`
            <h2>5 Labs Created (36 seats each)!</h2>
            <p>Lab 101 - Programming (A1-F6)</p>
            <p>Lab 102 - Networking (A1-F6)</p>
            <p>Lab 103 - Cybersecurity (A1-F6)</p>
            <p>Lab 104 - Multimedia (A1-F6)</p>
            <p>Lab 105 - AI (A1-F6)</p>
            <a href="/home" class="btn">Go Home</a>
        `);
    } catch (error) {
        res.status(500).send("Seeding error: " + error.message);
    }
});

// delete labs (for debugging)
app.get("/delete-labs", async (req, res) => {
    try {
        const Lab = require("./models/labSchema");
        const result = await Lab.deleteMany({});
        res.send(`${result.deletedCount} labs deleted.`);
    } catch (error) {
        res.status(500).send("Error deleting labs: " + error.message);
    }
});

// seed lab techs
app.get("/seed-techs", async (req, res) => {
    try {
        const User = require("./models/userSchema");
        const Lab = require("./models/labSchema");
        
        await User.deleteMany({ role: "Lab Technician" });
        
        // create 5 lab techs
        const techs = [
            { fullname: "John Doe", email: "john_doe@dlsu.edu.com", username: "john_doe_123", password: "techpass_jd1", role: "Lab Technician" },
            { fullname: "Jane Doe", email: "jane_doe@dlsu.edu.com", username: "jane_doe_321", password: "techpass_jd2", role: "Lab Technician" },
            { fullname: "Clyde Barrow", email: "clyde_barrow@dlsu.edu.com", username: "clyde_barrow_456", password: "techpass_cb", role: "Lab Technician" },
            { fullname: "Bonnie Parker", email: "bonnie_parker@dlsu.edu.com", username: "bonnie_parker_654", password: "techpass_bp", role: "Lab Technician" },
            { fullname: "Elliot Alderson", email: "elliot_alderson@dlsu.edu.com", username: "samsepi0l", password: "techpass_ea", role: "Lab Technician" }
        ];
        
        const createdTechs = await User.insertMany(techs);
        
        // get all labs and assign techs
        const labs = await Lab.find();
        for (let i = 0; i < labs.length; i++) {
            labs[i].lab_tech = createdTechs[i % createdTechs.length]._id;
            await labs[i].save();
        }
        
        res.send(`
            <h2>5 Lab Technicians created & assigned!</h2>
            <p>Lab Techs assigned to ${labs.length} labs.</p>
            <a href="/home" class="btn">Go Home</a>
        `);
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
