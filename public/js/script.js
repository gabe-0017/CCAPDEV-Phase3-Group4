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

document.addEventListener('DOMContentLoaded', function() {

    /* logout (modal) */
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

    /* edit reservation (modal) */
    const editModal = document.getElementById("editModal");
    const editBtns = document.querySelectorAll(".btn-edit");
    const editForm = document.getElementById("editReservationForm");
    const cancelEdit = document.getElementById("cancelEdit");
    const editLabSelect = document.getElementById("editLab");
    const editSeatSelect = document.getElementById("editSeat");

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

    editBtns.forEach(btn => {
        btn.addEventListener("click", async (e) => {
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

            document.getElementById("editDate").value = date || "";
            document.getElementById("editStartTime").value = startTime || "";
            document.getElementById("editEndTime").value = endTime || "";
            document.getElementById("editPurpose").value = purpose || "";

            editModal.style.display = "flex";
        });
    });

    if (editForm) {
        editForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(editForm);
            const id = formData.get("reservationId");

            if (!id) {
                alert('Unable to edit reservation: missing id.');
                return;
            }

            const payload = Object.fromEntries(formData.entries());
            try {
                const res = await fetch(`/reservations/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                if (res.ok) {
                    editModal.style.display = "none";
                    window.location.reload();
                } else {
                    alert(await res.text());
                }
            } catch (err) {
                console.error(err);
                alert("Update failed.");
            }
        });
    }

    if (cancelEdit) {
        cancelEdit.addEventListener("click", () => { 
            editModal.style.display = "none"; 
        });
    }

    /* cancel reservation (modal) */
    const cancelModal = document.getElementById("cancelModal");
    const cancelBtns = document.querySelectorAll(".btn-cancel");
    const cancelCancel = document.getElementById("cancelCancel");
    const confirmCancel = document.getElementById("confirmCancel");

    cancelBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const id = btn.dataset.id;
            if (confirmCancel) confirmCancel.dataset.id = id;
            if (cancelModal) cancelModal.style.display = "flex";
        });
    });

    if (cancelCancel && cancelModal) {
        cancelCancel.addEventListener("click", () => { 
            cancelModal.style.display = "none"; 
        });
    }

    if (confirmCancel) {
        confirmCancel.addEventListener("click", async () => {
            const id = confirmCancel.dataset.id;
            if (!id) {
                alert('Reservation ID not set.');
                return;
            }
            try {
                const res = await fetch(`/reservations/${id}`, {
                    method: "DELETE",
                    credentials: 'include'
                });
                if (res.ok) {
                    if (cancelModal) cancelModal.style.display = "none";
                    window.location.reload();
                } else {
                    alert(await res.text());
                }
            } catch (err) {
                console.error(err);
                alert("Cancellation failed.");
            }
        });
    }

    /* view reservation details (modal) */
    const viewDetailsModal = document.getElementById("viewDetailsModal");
    const viewBtns = document.querySelectorAll(".btn-view");
    const closeDetails = document.getElementById("closeDetails");

    viewBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            try {
                const res = await fetch(`/reservations/${id}`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const details = await res.json();
                    document.getElementById("detailTitle").textContent = (details.lab?.lab || "Lab") + " - " + details.seat;
                    document.getElementById("detailStatus").textContent = details.status;
                    document.getElementById("detailId").textContent = details._id || details.id;
                    document.getElementById("detailName").textContent = details.userId?.fullname || "";
                    document.getElementById("detailPurpose").textContent = details.purpose || "Not specified";
                    document.getElementById("detailReserved").textContent = details.createdAt ? new Date(details.createdAt).toLocaleString() : "";
                    document.getElementById("detailDate").textContent = details.date;
                    document.getElementById("detailStartTime").textContent = details.start_time || "";
                    document.getElementById("detailEndTime").textContent = details.end_time || "";
                    document.getElementById("detailTech").textContent = details.lab_tech?.fullname || details.lab?.lab_tech?.fullname || "Not assigned";
                } else {
                    alert(await res.text());
                }
            } catch (err) {
                console.error(err);
                alert("Failed to load details.");
            }
            if (viewDetailsModal) viewDetailsModal.style.display = "flex";
        });
    });

    if (closeDetails && viewDetailsModal) {
        closeDetails.addEventListener("click", () => { 
            viewDetailsModal.style.display = "none"; 
        });
    }
});
