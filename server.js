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

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// user authentication
app.use(session({
    secret: "your-secret-key-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true if using HTTPS
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

// root route (login page)
app.get("/", (req, res) => {
    res.redirect("/index");
});

// login page render
app.get("/index", (req, res) => {
    res.render("index");
});

// user routes
app.post("/register", userController.registerUser);
app.post("/login", userController.loginUser);
app.get("/profile/:id", isAuthenticated, userController.getUserProfile);
app.post("/profile/:id/update", isAuthenticated, userController.updateUserProfile);
app.get("/search", isAuthenticated, userController.searchUsers);
app.get("/register", (req, res) => {
    res.render("register");
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
app.delete("/deleteAccount", isAuthenticated, async (req, res) => {
    try {
        res.redirect("/index.html");
    } catch (error) {
        res.status(500).send("Error deleting account.");
    }
});

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
            .populate("userId")
            .populate("lab");
        if (!reservation) {
            return res.status(404).send("Reservation not found.");
        }
        res.json(reservation);
    } catch (error) {
        res.status(500).send("Error retrieving reservation.");
    }
});
app.get("/manage", isAuthenticated, reservationController.getReservations);
app.delete("/reservations/:id", isAuthenticated, reservationController.cancelReservation);
app.put("/reservations/:id", isAuthenticated, reservationController.editReservation);
app.get("/reservation", isAuthenticated, async (req, res) => {
    const labs = await require("./models/labSchema").find();
    res.render("reservation", { labs });
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
                
        // create seats A1-F6
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
            {
                lab: "Lab 101 - Programming Laboratory",
                seats: generateSeats()
            },
            {
                lab: "Lab 102 - Networking Laboratory", 
                seats: generateSeats()
            },
            {
                lab: "Lab 103 - Cybersecurity Laboratory",
                seats: generateSeats()
            },
            {
                lab: "Lab 104 - Multimedia Laboratory",
                seats: generateSeats()
            },
            {
                lab: "Lab 103 - AI Laboratory",
                seats: generateSeats()
            }
        ];
        
        await Lab.insertMany(labs);
        res.send(`
            <h2>5 Labs Created Successfully!</h2>
            <p><strong>Lab 101</strong> - Programming (72 seats)</p>
            <p><strong>Lab 102</strong> - Networking (72 seats)</p>
            <p><strong>Lab 103</strong> - Cybersecurity (72 seats)</p>
            <p><strong>Lab 104</strong> - Multimedia (72 seats)</p>
            <p><strong>Lab 105</strong> - AI (72 seats)</p>
        `);
    } catch (error) {
        res.status(500).send("Seeding error: " + error.message);
    }
});

app.get("/delete-labs", async (req, res) => {
    try {
        const Lab = require("./models/labSchema");
        const result = await Lab.deleteMany({});
        res.send(`${result.deletedCount} labs deleted.`);
    } catch (error) {
        res.status(500).send("Error deleting labs: " + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
