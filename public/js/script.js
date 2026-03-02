/* login verification */
const form = document.getElementById("loginForm");

if(form){
    form.addEventListener("submit", function(e){
        e.preventDefault(); // stop page reload

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        // any input is valid (for now)
        if(username !== "" && password !== ""){
            window.location.href = "pages/home.html";
        }
        else{
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

    // fake registration (doesn't save any info)
    if (fullname !== "" && email !== "" && username !== "" && password !== "") {
      window.location.href = "home.html";
    } else {
      alert("Please enter your information.");
    }
  });
}

/* logout modal */
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

/* edit reservation modal */
fetch("/modals/edit.html")
  .then(r => r.text())
  .then(data => {
    document.body.insertAdjacentHTML("beforeend", data);
    initializeEditModal();
  });

function initializeEditModal() {
  const editBtns = document.querySelectorAll(".btn-edit");
  const editModal = document.getElementById("editModal");
  const confirmEdit = document.getElementById("confirmEdit");

  editBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      editModal.style.display = "flex";
    });
  });

  if (confirmEdit) confirmEdit.addEventListener("click", () => {
    editModal.style.display = "none";
    alert("Reservation Updated!"); // replace with actual 'edit' logic later
  });
}

/* cancel reservation modal */
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
