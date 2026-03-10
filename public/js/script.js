/* login verification */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault(); // stop page reload

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        let storedUser = JSON.parse(localStorage.getItem("currentUser"));

        // fake student login (for faster testing)
        if (username.toLowerCase() === "student" && password.toLowerCase() === "student") {
            storedUser = {
                username: "student",
                role: "student"
            };
            localStorage.setItem("currentUser", JSON.stringify(storedUser));
            localStorage.setItem("role", "student");
            window.location.href = "pages/home.html";
            return;
        }

        // fake admin login (for testing only)
        if (username.toLowerCase() === "admin" && password.toLowerCase() === "admin") {
            storedUser = {
                username: "admin",
                role: "admin"
            };
            localStorage.setItem("currentUser", JSON.stringify(storedUser));
            localStorage.setItem("role", "admin");
            window.location.href = "pages/home.html";
            return;
        }

        if (storedUser && username === storedUser.username && password === storedUser.password) {
            localStorage.setItem("role", storedUser.role);
            window.location.href = "pages/home.html";
        } else {
            alert("Invalid username or password.");
        }
    });
}

/* signup verification */
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function(e) {
        e.preventDefault(); // stop page reload

        const fullname = document.getElementById("full_name").value.trim();
        const email = document.getElementById("email").value.trim();
        const username = document.getElementById("new_user").value.trim();
        const password = document.getElementById("new_pass").value.trim();
        const role = document.getElementById("role").value.trim();

        if (fullname && email && username && password && role) {
            let userView;
            if (role === "Lab Technician") {
              userView = "admin";
            } else {
              userView = "student";
            }
            
            const user = {};
            user.fullname = fullname;
            user.email = email;
            user.username = username;
            user.password = password;
            user.role = userView;

            localStorage.setItem("currentUser", JSON.stringify(user));
            localStorage.setItem("role", user.role);

            alert("Registration successful!");
            window.location.href = "home.html";
        } else {
            alert("Please fill out all fields.");
        }
    });
}

/* logout (modal) */
fetch("/modals/logout.html")
  .then(response => response.text())
  .then(data => {
    document.body.insertAdjacentHTML("beforeend", data);
    initializeLogoutModal(); // activate modal after loading
  });

function initializeLogoutModal() {

  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const cancelLogout = document.getElementById("cancelLogout");
  const confirmLogout = document.getElementById("confirmLogout");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function(e) {
      e.preventDefault();
      logoutModal.style.display = "flex";
    });
  }

  if (cancelLogout) {
    cancelLogout.addEventListener("click", function() {
      logoutModal.style.display = "none";
    });
  }

  if (confirmLogout) {
    confirmLogout.addEventListener("click", function() {
      window.location.href = "/";
    });
  }
}

/* delete account (modal) */
fetch("/modals/delete.html")
  .then(response => response.text())
  .then(data => {
    document.body.insertAdjacentHTML("beforeend", data);
    initializeDeleteModal();
});

function initializeDeleteModal() {
  const deleteBtn = document.getElementById("deleteAccountBtn");
  const modal = document.getElementById("deleteModal");
  const cancelBtn = document.getElementById("cancelDelete");
  const confirmBtn = document.getElementById("confirmDelete");

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      modal.style.display = "flex"; // show modal
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none"; // hide modal
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      modal.style.display = "none"; 
      alert("Account deleted!"); // add real DB logic later
      window.location.href = "/index.html"; // return to login after deletion
    });
  }
}

/* edit reservation (modal) */
fetch("/modals/edit.html")
  .then(r => r.text())
  .then(data => {
    document.body.insertAdjacentHTML("beforeend", data);
    initializeEditModal();
  });

function initializeEditModal() {
  const editBtns = document.querySelectorAll(".btn-edit");
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editReservationForm");
  const cancelEdit = document.getElementById("cancelEdit");

  editBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      editModal.style.display = "flex";
    });
  });

  if (editForm) {
    editForm.addEventListener("submit", e => {
      e.preventDefault(); // prevent page reload

      editModal.style.display = "none";
      alert("Reservation Updated!"); // add real DB logic later
    });
  }

  if (cancelEdit) {
    cancelEdit.addEventListener("click", () => {
      editModal.style.display = "none";
    });
  }
}

/* cancel reservation (modal) */
fetch("/modals/cancel.html")
  .then(r => r.text())
  .then(data => {
    document.body.insertAdjacentHTML("beforeend", data);
    initializeCancelModal();
  });

function initializeCancelModal() {
  const cancelBtns = document.querySelectorAll(".btn-cancel");
  const cancelModal = document.getElementById("cancelModal");
  const cancelCancel = document.getElementById("cancelCancel");
  const confirmCancel = document.getElementById("confirmCancel");

  cancelBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      cancelModal.style.display = "flex";
    });
  });

  if (cancelCancel) cancelCancel.addEventListener("click", () => cancelModal.style.display = "none");
  if (confirmCancel) confirmCancel.addEventListener("click", () => {
    cancelModal.style.display = "none";
    alert("Reservation Cancelled!"); // add real DB logic later
  });
}

/* view reservation details (modal) */
fetch("/modals/view-details.html")
  .then(r => r.text())
  .then(data => {
    document.body.insertAdjacentHTML("beforeend", data);
    initializeViewDetailsModal();
  });

function initializeViewDetailsModal() {

  const viewBtns = document.querySelectorAll(".btn-view");
  const modal = document.getElementById("viewDetailsModal");
  const closeBtn = document.getElementById("closeDetails");

  viewBtns.forEach(btn => {
    btn.addEventListener("click", () => {

      const reservationId = btn.dataset.id;

      // empty placeholders (for now)
      document.getElementById("detailTitle").textContent = "Laboratory - Seat";
      document.getElementById("detailStatus").textContent = "Status";
      document.getElementById("detailId").textContent = reservationId || "...";
      document.getElementById("detailName").textContent = "...";
      document.getElementById("detailReserved").textContent = "...";
      document.getElementById("detailArrived").textContent = "...";
      document.getElementById("detailDate").textContent = "...";
      document.getElementById("detailTime").textContent = "...";
      document.getElementById("detailTech").textContent = "...";

      modal.style.display = "flex";
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }
}

/* cancel Student's reservation (called from Adminmanage)*/


function canRemove() {
  document.querySelectorAll(".reservation-card").forEach(card => {
    const cancelBtn = card.querySelector(".btn-cancel");

    if (!cancelBtn) return;

    const dateText = card.querySelectorAll(".detail-value")[1].textContent.trim();
    const timeText = card.querySelectorAll(".detail-value")[2].textContent.trim();
    const startTime = timeText.split(" - ")[0];

    const reservationTime = new Date(`${dateText} ${startTime}`);

    function checkWindow() {
      const now = new Date();
      const minutesDiff = (now - reservationTime) / (1000 * 60);

      if (minutesDiff >= 0 && minutesDiff <= 10) {
        cancelBtn.disabled = false;
        cancelBtn.title = "";
      } else {
        cancelBtn.disabled = true;
        cancelBtn.title = "Can only cancel within 10 minutes of reservation start";
      }
    }

    checkWindow();
    setInterval(checkWindow, 30000);

    cancelBtn.addEventListener("click", function () {
      if (!this.disabled) {
        // Change status badge to Cancelled
        const statusBadge = card.querySelector(".status-badge");
        statusBadge.textContent = "Cancelled";
        statusBadge.className = "status-badge cancelled";

        // Remove Edit and Cancel buttons, add View Details
        const actionsDiv = card.querySelector(".reservation-actions");
        actionsDiv.innerHTML = `<button class="btn btn-view">View Details</button>`;
      }
    });
  });
}

/* ===== ADMIN VIEW ===== */

// 'Search' portal card (for admin homepage)
const storedUser = JSON.parse(localStorage.getItem("currentUser")); // read the current user info

if (storedUser && storedUser.role === "admin") { // if current user's role=admin then show the search portal card
    const searchCard = document.getElementById("adminSearchCard");
    if (searchCard) {
      searchCard.style.display = "block";
    }
}

// Admin navbar
function initializeNavbarRole() {
  const storedUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!storedUser) return;

  if (storedUser.role === "admin") {
    const navLinks = document.getElementById("navLinks");

    if (!navLinks) return;

    // prevent duplicate insertion
    if (!document.getElementById("adminSearchLink")) {
      const li = document.createElement("li");
      li.id = "adminSearchLink";

      const link = document.createElement("a");
      link.href = "adminSearch.html";
      link.textContent = "Search";

      li.appendChild(link);
      navLinks.insertBefore(li, navLinks.firstChild);
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initializeNavbarRole();
});

// Reserve for a student
function initializeReservationRole() {
  const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  const studentEmail = document.getElementById("studentEmail");

  if (!studentEmail) return;

  if (!storedUser || storedUser.role !== "admin") {
    studentEmail.style.display = "none"; // hide for student view
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initializeReservationRole();
});



/* Laboratories slot availability */
function initializeLabSeatReservationView() {
  const seatGrid = document.querySelector('.seat-grid');
  const reservationPanel = document.getElementById('seatReservationPanel');
  const reservationTitle = document.getElementById('reservationPanelTitle');
  const dateInput = document.getElementById('reservationDate');
  const timeslotContainer = document.getElementById('reservationTimeslots');
  const labSelect = document.querySelector('.lab-select');

  if (!seatGrid || !reservationPanel || !reservationTitle || !dateInput || !timeslotContainer) return;

  let selectedSeat = null;

  const today = new Date();
  dateInput.min = formatDateInput(today);
  dateInput.max = formatDateInput(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
  dateInput.value = dateInput.min;

  seatGrid.querySelectorAll('.seat').forEach(seat => {
    seat.addEventListener('click', () => {
      if (seat.classList.contains('reserved')) return;

      document.querySelectorAll('.seat.selected').forEach(s => s.classList.remove('selected'));
      seat.classList.add('selected');

      selectedSeat = seat.textContent.trim();
      reservationPanel.style.display = 'block';
      reservationTitle.textContent = `Seat ${selectedSeat} Reservations`;

      renderTimeslots(selectedSeat, dateInput.value, labSelect?.value);
    });
  });

  dateInput.addEventListener('change', () => {
    if (!selectedSeat) return;
    renderTimeslots(selectedSeat, dateInput.value, labSelect?.value);
  });

  if (labSelect) {
    labSelect.addEventListener('change', () => {
      selectedSeat = null;
      document.querySelectorAll('.seat.selected').forEach(s => s.classList.remove('selected'));
      reservationPanel.style.display = 'none';
      timeslotContainer.innerHTML = '<p class="hint">Select a seat and date to see available time slots.</p>';
    });
  }

  ensureDemoReservations();

  function renderTimeslots(seat, date, lab) {
    const seatKey = `${lab || 'lab1'}-${seat}`;
    const reservations = getReservations();
    const dayReservations = (reservations[seatKey] && reservations[seatKey][date]) || {};

    const slots = generateTimeSlots('08:00', '20:00');

    const table = document.createElement('table');
    table.className = 'timeslot-table';

    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Time</th><th>Status</th><th>Reserved By</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    slots.forEach(slot => {
      const startKey = slot.start;
      const reservation = dayReservations[startKey];

      const tr = document.createElement('tr');
      const timeTd = document.createElement('td');
      timeTd.textContent = `${slot.start} - ${slot.end}`;

      const statusTd = document.createElement('td');
      statusTd.className = 'status';

      const reservedByTd = document.createElement('td');

      if (reservation) {
        statusTd.textContent = 'Reserved';
        statusTd.classList.add('reserved');

        if (reservation.anonymous) {
          reservedByTd.textContent = 'Reserved anonymously';
        } else {
          const anchor = document.createElement('a');
          anchor.textContent = reservation.username;
          anchor.href = `profile.html?user=${encodeURIComponent(reservation.username)}`;
          anchor.target = '_self';
          reservedByTd.appendChild(anchor);
        }
      } else {
        statusTd.textContent = 'Available';
        statusTd.classList.add('available');
        reservedByTd.textContent = '-';
      }

      tr.appendChild(timeTd);
      tr.appendChild(statusTd);
      tr.appendChild(reservedByTd);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    timeslotContainer.innerHTML = '';
    timeslotContainer.appendChild(table);
  }

  function generateTimeSlots(startTime, endTime) {
    const slots = [];

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    const endTotalMin = endHour * 60 + endMin;

    while (currentHour * 60 + currentMin < endTotalMin) {
      const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin -= 60;
        currentHour += 1;
      }

      const slotEnd = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

      slots.push({ start: slotStart, end: slotEnd });
    }

    return slots;
  }

  function formatDateInput(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getReservations() {
    const reservations = localStorage.getItem('labReservations');
    return reservations ? JSON.parse(reservations) : {};
  }

  function saveReservations(reservations) {
    localStorage.setItem('labReservations', JSON.stringify(reservations));
  }

  function ensureDemoReservations() {
    const reservations = getReservations();
    if (Object.keys(reservations).length > 0) return;

    const todayKey = formatDateInput(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = formatDateInput(tomorrow);

    const demo = {
      'lab1-A1': {
        [todayKey]: {
          '08:00': { username: 'student', anonymous: false },
          '10:00': { anonymous: true },
          '13:00': { username: 'admin', anonymous: false }
        },
        [tomorrowKey]: {
          '11:00': { username: 'student', anonymous: false }
        }
      },
      'lab1-B2': {
        [todayKey]: {
          '09:30': { anonymous: true },
          '14:00': { username: 'john_doe', anonymous: false }
        }
      }
    };

    saveReservations(demo);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  initializeLabSeatReservationView();
});
/* End of Laboratories slot availability */

