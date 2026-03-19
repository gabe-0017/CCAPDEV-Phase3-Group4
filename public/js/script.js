/* login verification */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) window.location.href = "/home";
            else alert(await res.text() || "Invalid login credentials.");
        } catch (err) {
            console.error(err);
            alert("Login error. Try again.");
        }
    });
}

/* register verification */
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fullname = document.getElementById("full_name").value.trim();
        const email = document.getElementById("email").value.trim();
        const username = document.getElementById("new_user").value.trim();
        const password = document.getElementById("new_pass").value.trim();
        const role = document.getElementById("role").value.trim();

        try {
            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullname, email, username, password, role })
            });

            if (res.ok) window.location.href = "/home";
            else alert(await res.text() || "Registration failed.");
        } catch (err) {
            console.error(err);
            alert("Registration error.");
        }
    });
}

/* logout (modal) */
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById("logoutBtn");
    const logoutModal = document.getElementById("logoutModal");
    const cancelLogout = document.getElementById("cancelLogout");
    const confirmLogout = document.getElementById("confirmLogout");

    // show modal
    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener("click", (e) => { 
            e.preventDefault(); 
            logoutModal.style.display = "flex"; 
        });
    }

    // hide modal ('no' clicked)
    if (cancelLogout && logoutModal) {
        cancelLogout.addEventListener("click", () => { 
            logoutModal.style.display = "none"; 
        });
    }

    // confirm logout ('yes' clicked)
    if (confirmLogout) {
        confirmLogout.addEventListener("click", async () => {
            try {
                const res = await fetch("/logout", { method: "GET" });
                if (res.ok) {
                    window.location.href = "/";
                } else {
                    alert(await res.text() || "Logout failed");
                }
            } catch (err) {
                console.error(err);
                alert("Logout error. Please try again.");
            }
        });
    }

    // close modal
    if (logoutModal) {
        logoutModal.addEventListener("click", (e) => {
            if (e.target === logoutModal) {
                logoutModal.style.display = "none";
            }
        });
    }
});

/* edit reservation (modal) */
const editModal = document.getElementById("editModal");
const editBtns = document.querySelectorAll(".btn-edit");
const editForm = document.getElementById("editReservationForm");
const cancelEdit = document.getElementById("cancelEdit");

async function populateEditSeats(labId, selectedSeat) {
    if (!labId || !editSeatSelect) return;
    editSeatSelect.innerHTML = '<option disabled selected>Select a seat</option>';

    try {
        const res = await fetch(`/labs/${labId}`);
        if (!res.ok) return;
        const lab = await res.json();

        lab.seats.forEach(seat => {
            const option = document.createElement('option');
            option.value = seat.seatNumber;
            option.textContent = seat.seatNumber;
            if (seat.seatNumber === selectedSeat) option.selected = true;
            editSeatSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading seats for edit modal:', err);
    }
}

if (editLabSelect) {
    editLabSelect.addEventListener('change', async () => {
        const labId = editLabSelect.value;
        await populateEditSeats(labId, null);
    });
}

editBtns.forEach(btn => btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const id = btn.dataset.id;
    document.getElementById("editReservationId").value = id;

    const labId = btn.dataset.labId;
    const seat = btn.dataset.seat;
    const date = btn.dataset.date;
    const startTime = btn.dataset.start;
    const endTime = btn.dataset.end;
    const purpose = btn.dataset.purpose;

    if (editLabSelect && labId) editLabSelect.value = labId;
    await populateEditSeats(labId, seat);

    const editDateInput = document.getElementById("editDate");
    const editStartInput = document.getElementById("editStartTime");
    const editEndInput = document.getElementById("editEndTime");
    const editPurposeInput = document.getElementById("editPurpose");

    if (editDateInput) editDateInput.value = date || "";
    if (editStartInput) editStartInput.value = startTime || "";
    if (editEndInput) editEndInput.value = endTime || "";
    if (editPurposeInput) editPurposeInput.value = purpose || "";

    editModal.style.display = "flex";

}));

if (editForm) editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(editForm);
    const id = formData.get("reservationId");

    if (!id) {
        console.error('Edit request missing reservation id.');
        alert('Unable to edit reservation: missing id. Please try again.');
        return;
    }

    const payload = Object.fromEntries(formData.entries());
    const url = `/reservations/${encodeURIComponent(id)}`;
    console.log('Sending edit request', url, payload);

    try {
        const res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        if (res.ok) {
            editModal.style.display = "none";
            window.location.reload();
        }
        else alert(await res.text());
    } catch (err) {
        console.error(err);
        alert("Update failed.");
    }
});

if (cancelEdit) cancelEdit.addEventListener("click", () => { editModal.style.display = "none"; });

/* cancel reservation (modal) */
const cancelModal = document.getElementById("cancelModal");
const cancelBtns = document.querySelectorAll(".btn-cancel");
const cancelCancel = document.getElementById("cancelCancel");
const confirmCancel = document.getElementById("confirmCancel");

cancelBtns.forEach(btn => btn.addEventListener("click", (e) => {
    e.preventDefault();
    const id = btn.dataset.id;
    confirmCancel.dataset.id = id;
    cancelModal.style.display = "flex";
}));
if (cancelCancel) cancelCancel.addEventListener("click", () => cancelModal.style.display = "none");
if (confirmCancel) confirmCancel.addEventListener("click", async () => {
    const id = confirmCancel.dataset.id;
    console.log('Deleting reservation with ID:', id);
    console.log('Fetch URL:', `/reservations/${id}`);
    if (!id) {
        alert('Reservation ID not set. Please try again.');
        return;
    }
    try {
        const res = await fetch(`/reservations/${id}`, {
            method: "DELETE",
            credentials: 'include'
        });
        if (res.ok) {
            cancelModal.style.display = "none";
            window.location.reload();
        }
        else alert(await res.text());
    } catch (err) {
        console.error(err);
        alert("Cancellation failed.");
    }
});

/* view reservation details (modal) */
const viewDetailsModal = document.getElementById("viewDetailsModal");
const viewBtns = document.querySelectorAll(".btn-view");
const closeDetails = document.getElementById("closeDetails");

viewBtns.forEach(btn => btn.addEventListener("click", async () => {
    const id = btn.dataset.id;
    try {
        const res = await fetch(`/reservations/${id}`, {
            credentials: 'include'
        });
        if (res.ok) {
            const details = await res.json();
            document.getElementById("detailTitle").textContent = (details.lab && details.lab.lab ? details.lab.lab : "Lab") + " - " + details.seat;
            document.getElementById("detailStatus").textContent = details.status;
            document.getElementById("detailId").textContent = details._id || details.id;
            document.getElementById("detailName").textContent = details.userId && details.userId.fullname ? details.userId.fullname : "";
            document.getElementById("detailReserved").textContent = details.createdAt ? new Date(details.createdAt).toLocaleString() : "";
            document.getElementById("detailArrived").textContent = details.arrived ? new Date(details.arrived).toLocaleString() : "";
            document.getElementById("detailDate").textContent = details.date;
            document.getElementById("detailStartTime").textContent = details.start_time ? details.start_time : "";
            document.getElementById("detailEndTime").textContent = details.end_time ? details.end_time : "";
            document.getElementById("detailTech").textContent = details.lab && details.lab.lab_tech && details.lab.lab_tech.fullname ? details.lab.lab_tech.fullname : "";
        } else alert(await res.text());
    } catch (err) {
        console.error(err);
        alert("Failed to load details.");
    }
    viewDetailsModal.style.display = "flex";
}));

if (closeDetails) closeDetails.addEventListener("click", () => { viewDetailsModal.style.display = "none"; });
