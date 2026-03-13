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
const logoutModal = document.getElementById("logoutModal");
const logoutBtn = document.getElementById("logoutBtn");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");

if (logoutBtn) logoutBtn.addEventListener("click", (e) => { e.preventDefault(); logoutModal.style.display = "flex"; });
if (cancelLogout) cancelLogout.addEventListener("click", () => { logoutModal.style.display = "none"; });
if (confirmLogout) confirmLogout.addEventListener("click", async () => {
    try {
        const res = await fetch("/logout", { method: "GET" });
        if (res.ok) window.location.href = "/";
        else alert(await res.text());
    } catch (err) {
        console.error(err);
        alert("Logout error.");
    }
});

/* edit reservation (modal) */
const editModal = document.getElementById("editModal");
const editBtns = document.querySelectorAll(".btn-edit");
const editForm = document.getElementById("editReservationForm");
const cancelEdit = document.getElementById("cancelEdit");

editBtns.forEach(btn => btn.addEventListener("click", (e) => { e.preventDefault(); editModal.style.display = "flex"; }));

if (editForm) editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(editForm);
    const id = formData.get("reservationId");
    const payload = Object.fromEntries(formData.entries());
    try {
        const res = await fetch(`/reservations/${id}`, {  // CHANGED: /reservation to /reservations
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) editModal.style.display = "none";
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

cancelBtns.forEach(btn => btn.addEventListener("click", (e) => { e.preventDefault(); cancelModal.style.display = "flex"; }));
if (cancelCancel) cancelCancel.addEventListener("click", () => cancelModal.style.display = "none");
if (confirmCancel) confirmCancel.addEventListener("click", async () => {
    const id = confirmCancel.dataset.id;
    try {
        const res = await fetch(`/reservations/${id}`, {  // CHANGED: /reservation to /reservations
            method: "DELETE"
        });
        if (res.ok) cancelModal.style.display = "none";
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
        const res = await fetch(`/reservations/${id}`);  // CHANGED: /reservation to /reservations
        if (res.ok) {
            const details = await res.json();
            document.getElementById("detailTitle").textContent = details.lab + " - " + details.seat;
            document.getElementById("detailStatus").textContent = details.status;
            document.getElementById("detailId").textContent = details.id;
            document.getElementById("detailName").textContent = details.name;
            document.getElementById("detailReserved").textContent = details.reserved;
            document.getElementById("detailArrived").textContent = details.arrived;
            document.getElementById("detailDate").textContent = details.date;
            document.getElementById("detailTime").textContent = details.time;
            document.getElementById("detailTech").textContent = details.tech;
        } else alert(await res.text());
    } catch (err) {
        console.error(err);
        alert("Failed to load details.");
    }
    viewDetailsModal.style.display = "flex";
}));

if (closeDetails) closeDetails.addEventListener("click", () => { viewDetailsModal.style.display = "none"; });





/* delete account (modal) */
const deleteModal = document.getElementById("deleteModal");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

if (deleteAccountBtn) deleteAccountBtn.addEventListener("click", () => {
    deleteModal.style.display = "flex";
});

if (cancelDelete) cancelDelete.addEventListener("click", () => {
    deleteModal.style.display = "none";
});

if (confirmDelete) confirmDelete.addEventListener("click", async () => {
    try {
        const res = await fetch("/deleteAccount", { method: "DELETE" });
        if (res.ok) window.location.href = "/";
        else alert("Error deleting account. Please try again.");
    } catch (err) {
        console.error(err);
        alert("Delete error.");
    }
});