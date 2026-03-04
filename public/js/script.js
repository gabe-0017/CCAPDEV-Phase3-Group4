/* login verification */
const form = document.getElementById("loginForm");

if(form){
    form.addEventListener("submit", function(e){
        e.preventDefault(); // stop page reload

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        if(username == "Admin" && password == "Admin"){
            window.location.href = "pages/AdminHome.html";
        }else if(username !== "" && password !== ""){
            window.location.href = "pages/home.html";
        }else{
            alert("Please enter username and password.");
        }
    });
}

/* signup verification */
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", function(e) {
    e.preventDefault(); // stop page reload

    const email = document.getElementById("email").value;
    const password = document.getElementById("new_pass").value;
    const username = document.getElementById("new_user").value;
    const fullname = document.getElementById("full_name").value;

    // fake registration (doesn't save any info yet)
    if (fullname !== "" && email !== "" && username !== "" && password !== "") {
      window.location.href = "home.html";
    } else {
      alert("Please enter your information.");
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
      alert("Reservation Updated!"); // replace later with real DB logic
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
    alert("Reservation Cancelled!"); // replace with actual 'cancel' logic later
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




