const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const session = require("express-session");

const app = express();
const PORT = 3000;

const userController = require("./controllers/userController");
const labController = require("./controllers/labController");
const reservationController = require("./controllers/reservationController");
const Reservation = require("./models/reservationSchema");

mongoose.connect('mongodb://localhost:27017/labreserve')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));

app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));
app.engine("handlebars", exphbs.engine({
  extname: "handlebars",
  helpers: { eq: (a, b) => a === b },
  defaultLayout: false,
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));

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
app.get("/profile", isAuthenticated, (req, res) => {
    res.redirect(`/profile/${req.session.user._id}`);
});
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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);

});
