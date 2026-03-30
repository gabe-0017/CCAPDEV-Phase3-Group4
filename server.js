require('dotenv').config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const exphbs = require("express-handlebars");
const fileUpload = require("express-fileupload");

const app = express();
const PORT = process.env.PORT || 3000;

const router = express.Router();
const Lab = require('./models/labSchema');
const Reservation = require('./models/reservationSchema');

const userController = require("./controllers/userController");
const labController = require("./controllers/labController");
const reservationController = require("./controllers/reservationController");

/********** DB CONNECTION / ENGINE SETTING / SESSION CREATION **********/

// connect to database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Error:', err.message);
        process.exit(1);
    });

// handlebars engine
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    abortOnLimit: true,
    responseOnLimit: 'File size too large'
}));

// create session
const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    rolling: true,
    store: sessionStore,
    cookie: { 
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// req debug log
app.use((req, res, next) => {
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    next();
});

// session debug log
app.use((req, res, next) => {
    console.log('===== SESSION LOG =====');
    console.log('Session ID:', req.sessionID);
    console.log('User in session:', req.session.user ? 'EXISTS' : 'NULL');
    console.log('MongoDB Connected:', mongoose.connection.readyState === 1 ? 'YES' : 'NO');
    console.log('=======================');
    next();
});

/********** ROUTES **********/

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

/* sesseion debug route */
app.get('/test-session', (req, res) => {
    req.session.test = 'hello-' + Date.now();
    res.json({
        sessionId: req.sessionID,
        user: req.session.user,
        test: req.session.test,
        cookies: req.headers.cookie
    });
});

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
        
        console.log("Searching for email:", email); // debug cmd log

        const student = await User.findOne({ 
            $or: [
                { email: email.trim() }, // exact-match
                { email: { $regex: email.trim(), $options: "i" } } // case-insensitive
            ],
            role: "Student" 
        });
        
        console.log("Found student:", student ? student.email : "NONE"); // debug cmd log
        
        if (!student) {
            return res.render("adminSearch", { error: `No student found with email "${email}".` });
        }
        
        res.redirect(`/manage?userId=${student._id}`);
    } catch (error) {
        console.error("Admin search error:", error);
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
app.get('/labs/:labId/slots', isAuthenticated, async (req, res) => {
    try {
        const { labId } = req.params;
        const { seat, date } = req.query;

        if (!seat || !date) {
            return res.status(400).json({ error: "Seat and date are required." });
        }

        console.log('==================================================');
        console.log(`Requested labId: ${labId} seat: ${seat} date: ${date}`);

        // fetch reservations for selected lab/seat/date (ignore 'cancelled' reservations)
        const reservations = await Reservation.find({
            lab: labId,
            seat: seat,
            date: date,
            status: { $ne: "Cancelled" }
        });

        console.log("Found reservations:", reservations);

        // define all possible 30-min slots from 08:00 to 18:00
        const slots = [];
        let startHour = 8;
        let endHour = 18;
        for (let h = startHour; h < endHour; h++) {
            slots.push(`${String(h).padStart(2, '0')}:00`);
            slots.push(`${String(h).padStart(2, '0')}:30`);
        }

        // remove reserved slots
        const availableSlots = slots.filter(slot => {
            return !reservations.some(r => {
                const resStart = r.start_time;
                const resEnd = r.end_time;

                return slot >= resStart && slot < resEnd;
            });
        });

        if (availableSlots.length === 0) {
            return res.json({ message: "No available time slots for this seat on this date.", availableSlots: [] });
        }

        res.json({ seat, date, availableSlots });
        console.log("Available slots:", availableSlots);
        console.log('==================================================');

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/:labId/availability', async (req, res) => {
    try {
        const labId = req.params.labId;
        const date = req.query.date;

        // fetch lab seats
        const lab = await Lab.findById(labId);
        if (!lab) return res.status(404).json({ error: 'Lab not found' });

        // fetch reservations for this lab and date
        const reservations = await Reservation.find({
            lab: labId,
            seat: seat,
            date: date,
            status: { $ne: "Cancelled" }
        });

        // create availability map
        const seatStatus = lab.seats.map(seatNum => {
            const reserved = reservations.find(r => r.seats.includes(seatNum));
            return {
                seatNumber: seatNum,
                reserved: !!reserved,
                reservedBy: reserved && !reserved.anonymous ? reserved.userName : null
            };
        });

        res.json({ labId, date, seatStatus });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
module.exports = router;

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

// about page
app.get("/about", (req, res) => {
    res.render("about");
});

// test route (for db connection debug)
app.get('/test-db', async (req, res) => {
    try {
        const count = await require('./models/userSchema').countDocuments();
        res.json({ connected: true, users: count });
    } catch (e) {
        res.json({ connected: false, error: e.message });
    }
});

/********** DATA CONFIG **********/

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
        const bcrypt = require('bcryptjs');
        const User = require("./models/userSchema");
        const Lab = require("./models/labSchema");
        
        await User.deleteMany({ role: "Lab Technician" });
        
        // create 5 lab techs
        const techsData = [
            { fullname: "John Doe", email: "john_doe@dlsu.edu.com", username: "john_doe_123", password: "techpass_jd1", role: "Lab Technician" },
            { fullname: "Jane Doe", email: "jane_doe@dlsu.edu.com", username: "jane_doe_321", password: "techpass_jd2", role: "Lab Technician" },
            { fullname: "Clyde Barrow", email: "clyde_barrow@dlsu.edu.com", username: "clyde_barrow_456", password: "techpass_cb", role: "Lab Technician" },
            { fullname: "Bonnie Parker", email: "bonnie_parker@dlsu.edu.com", username: "bonnie_parker_654", password: "techpass_bp", role: "Lab Technician" },
            { fullname: "Elliot Alderson", email: "elliot_alderson@dlsu.edu.com", username: "samsepi0l", password: "techpass_ea", role: "Lab Technician" }
        ];

        // hash passwords before save
        const techs = [];
        for (const techData of techsData) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(techData.password, salt);
            techs.push({
                ...techData,
                password: hashedPassword
            });
            console.log(`Hashed ${techData.username}: ${hashedPassword.substring(0, 20)}...`);
        }
        
        const createdTechs = await User.insertMany(techs);
        
        // assign to labs
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

// Profile API endpoints
app.post("/profile/upload-picture", isAuthenticated, async (req, res) => {
    try {
        const User = require("./models/userSchema");
        
        if (!req.files || !req.files.profilePicture) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.files.profilePicture;
        
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: "File must be an image" });
        }

        // Convert to base64
        const base64 = file.data.toString('base64');
        const dataURI = `data:${file.mimetype};base64,${base64}`;

        const user = await User.findByIdAndUpdate(
            req.session.user._id,
            { profilePicture: dataURI },
            { new: true }
        );

        res.json({ success: true, profilePicture: user.profilePicture });
    } catch (error) {
        console.error("Error uploading picture:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/profile/update-description", isAuthenticated, async (req, res) => {
    try {
        const User = require("./models/userSchema");
        const { description } = req.body;

        const user = await User.findByIdAndUpdate(
            req.session.user._id,
            { description: description || "" },
            { new: true }
        );

        res.json({ success: true, description: user.description });
    } catch (error) {
        console.error("Error updating description:", error);
        res.status(500).json({ error: error.message });
    }
});

/********** RUN SERVER **********/

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Deployed: Check Render dashboard`);
});
