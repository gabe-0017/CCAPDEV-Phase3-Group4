const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const userController = require("./controllers/userController");
const labController = require("./controllers/labController");
const reservationController = require("./controllers/reservationController");

// user routes
app.post("/register", userController.registerUser);
app.post("/login", userController.loginUser);
app.get("/profile/:id", userController.getUserProfile);
app.get("/search", userController.searchUsers);

// lab routes
app.get("/labs", labController.getLabs);
app.post("/labs/create", labController.createLab);

// reservation routes
app.post("/reserve", reservationController.createReservation);
app.get("/reservations", reservationController.getReservations);
app.delete("/reservation/:id", reservationController.cancelReservation);
app.put("/reservation/:id", reservationController.editReservation);

// status route
app.get("/status", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Error: Page not found.");
});
