 //GLOBAL STATE
let guest = "";
let page = 1;

//INITIAL SCREEN
showNameInput();

function showNameInput() {

document.getElementById("screen").innerHTML = `
  <h2>Find your name:</h2>
  <input id="guest">
  <button onclick="searchName()">Find</button>
`;

}
//SEARCH FUNCTION
async function searchName() {
  const guestInput = document.getElementById("guest").value.trim();
  
  // 1. Trigger loading screen instantly when they click "Find"
  showLoading("Searching list...");

  let response = await fetch(
    "https://script.google.com/macros/s/AKfycbyIvNFICoN16ta_nxYkCfiWsBHuzZgd8v9emDRmp88TqQXadM9d0_ZpZIQRmzkof6dKMQ/exec?guest="
    + encodeURIComponent(guestInput)
  );

  let matches = await response.json();

  let html = `<h2>Select your name</h2>`;

  if (!matches || matches.length === 0) {
    document.getElementById("screen").innerHTML = `
      <h2>Name is not in the invite list</h2>
      <button onclick="showNameInput()">Try again</button>
    `;
    return;
  }

  // Loop through your list - click triggers selection confirmation automatically
  matches.forEach(m => {
    html += `
    <label onclick="selectAndProceed(this)">
      <input
        type="radio"
        name="guest"
        value="${m.name}"
        data-seats="${m.seats || ''}"
        data-companions="${m.companions || ''}"
      >
      ${m.name}
    </label>
    `;
  });

  document.getElementById("screen").innerHTML = html;
}

//RENDER RESULTS
function renderResults(data) {

  let html = `<h2>Select your name</h2>`;

  data.results.forEach(m => {
    html += `
      <label onclick="selectAndProceed(this)">
        <input
          type="radio"
          name="guest"
          value="${m.name}"
          data-seats="${m.seats}"
          data-companions="${m.companions}"
        >
        ${m.name}
      </label>
    `;
  });

  html += `<br>`;

  if ((page * 10) < data.total) {
    html += `<button onclick="nextPage()">Next</button>`;
  }

  if (page > 1) {
    html += `<button onclick="prevPage()">Previous</button>`;
  }

  document.getElementById("screen").innerHTML = html;
}

// REPLACE THIS FUNCTION IN YOUR SCRIPT.JS
function confirmName() {
  let radio = document.querySelector('input[name="guest"]:checked');

  if (!radio) {
    return; // Safety exit if nothing is selected
  }

  window.tempCompanions = [];

  let selected = {
    name: radio.value,
    seats: parseInt(radio.getAttribute("data-seats")) || 1,
    companions: radio.getAttribute("data-companions") || ""
  };

  window.currentGuest = selected;

  let companions = selected.companions
    .split(",")
    .map(x => x.trim())
    .filter(x => x.length > 0);

  // Automatically save the existing companions to our background state
  window.tempCompanions = companions;

  // CONDITION CHECK: If they have multiple seats, let them edit companions right away
  if (selected.seats > 1) {
    editCompanions(); // Takes them directly to the input box to edit/confirm companion names
  } else {
    // If they only have 1 seat, skip everything and go straight to attendance
    window.currentGuest.companions = "";
    window.tempCompanions = [];
    showAttendanceQuestion();
  }
}


function finalStep() {
  document.getElementById("screen").innerHTML = `
    <h2>Thank you for confirming!</h2>
  `;
}

// REPLACE THE OLD showConfirmScreen FUNCTION WITH THIS NEW BALANCED LAYOUT
function showConfirmScreen() {

  let maxSeats = window.currentGuest.seats;
  let companions = window.tempCompanions || [];

  let html = `
    <h2>Confirm Invitation Details</h2>
    <p>Please review your party profile details below:</p>

    <div class="confirm-profile-box">
      <p><b>Main Guest:</b> ${window.currentGuest.name}</p>
      <p><b>Total Seats Reserved:</b> ${maxSeats}</p>
      
      <p style="margin-top: 12px; font-weight: 600;">Companions:</p>
      <ul class="companion-badge-list">
  `;

  // Render the names inside the beautiful white badges we styled in CSS
  if (companions.length > 0) {
    companions.forEach(c => {
      html += `<li>${c}</li>`;
    });
  } else {
    html += `<li style="background: transparent; border: none; padding: 0; font-style: italic; color: #999 !important;">No companions added</li>`;
  }

  html += `
      </ul>
    </div>

    <p style="margin-bottom: 15px; font-weight: 500; color: #4a4a4a;">Is this information correct?</p>

    <button onclick="proceedAttendance()">Yes, Everything is Correct</button>
    <button onclick="editCompanions()">No, Edit Names</button>
  `;

  document.getElementById("screen").innerHTML = html;
}

function proceedAttendance() {
  window.currentGuest.companions = (window.tempCompanions || []).join(", ");
  showAttendanceQuestion();
}

function editCompanions() {
  let max = window.currentGuest.seats - 1;
  let companions = window.tempCompanions || [];

  let badgesHtml = "";
  if (companions.length > 0) {
    companions.forEach(c => {
      badgesHtml += `
        <li style="display: block; background: #ffffff; color: #5d534a; font-size: 13px; font-weight: 500; padding: 10px 16px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.05); margin: 6px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.02); text-align: left; width: 100%; box-sizing: border-box;">
          ${c}
        </li>`;
    });
  } else {
    badgesHtml = `<span style="font-style: italic; color: #999;">None entered yet</span>`;
  }

  // Wrap the entire template in our new safe layout div
  let html = `
    <div class="screen-content">
      <h2>Review Companions</h2>
      <p style="color: #6b6b6b; font-size: 13px; margin-bottom: 10px;">Your reservation includes <b>${max}</b> companion seat(s):</p>
      
      <div style="background: rgba(255, 255, 255, 0.4); border-radius: 16px; padding: 14px 18px; margin: 15px 0 25px 0; border: 1px dashed rgba(0, 0, 0, 0.08); text-align: left; width: 100%;">
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; align-items: flex-start; width: 100%;">
          ${badgesHtml}
        </ul>
      </div>

      <button onclick="showAttendanceQuestion()">Everything is Correct</button>
      <button onclick="showCompanionInputForm()">Change Names</button>
    </div>
  `;

  document.getElementById("screen").innerHTML = html;
}

function saveEditedCompanions() {

  let max = window.currentGuest.seats - 1;

  let input = document.getElementById("editList").value;

  let list = input
    .split(",")
    .map(x => x.trim())
    .filter(x => x.length > 0);

  if (list.length > max) {
    alert(`You can only add up to ${max} companions.`);
    return;
  }

  window.tempCompanions = list;

  showConfirmScreen();
}

//GENERATE INPUTS
function generateGuests() {

  const maxSeats = parseInt(window.currentGuest.seats || 1);
  const maxCompanions = Math.max(maxSeats - 1, 0);

  const input =
    document.getElementById("companionList").value || "";

  let companions =
    input
      .split(",")
      .map(x => x.trim())
      .filter(x => x.length > 0);

  // LIMIT CHECK
  if (companions.length > maxCompanions) {
    alert(`You can only add up to ${maxCompanions} companion(s).`);
    return;
  }

  window.tempRSVP = {
  companions: companions
  };

  let html = `
    <h2>Confirm Updated List</h2>

    <p><b>Seats:</b> ${maxSeats}</p>

    <ul>
      <li><b>${window.currentGuest.name}</b> (Main Guest)</li>
  `;

  companions.forEach(c => {
    html += `<li>${c}</li>`;
  });

  html += `
    </ul>

    <p>Is this correct?</p>

    <button onclick="confirmAttendanceChoice()">Yes</button>
    <button onclick="attendanceNo()">No</button>
  `;

  document.getElementById("screen").innerHTML = html;
}

function reviewGuestList(count) {

  let guests = [];

  for (let i = 1; i <= count; i++) {
    let name = document.getElementById("g" + i).value;
    if (name) guests.push(name);
  }

  window.tempRSVP.guests = guests;

  let html = `
    <h2>Confirm Updated List</h2>
    <p><b>Seats:</b> ${guests.length}</p>
    <p><b>Guests:</b></p>
    <ul>
  `;

  guests.forEach(g => {
    html += `<li>${g}</li>`;
  });

  html += `
    </ul>

    <p>Is this correct?</p>

    <button onclick="confirmAttendanceChoice()">Yes</button>
    <button onclick="attendanceNo()">No, Edit Again</button>
  `;

  document.getElementById("screen").innerHTML = html;
}

function confirmAttendanceChoice() {
  saveGuestList();
}
 async function saveGuestList() {
  try {

    let guest = window.currentGuest;

    if (!guest || !window.tempRSVP) {
      alert("Missing data");
      return;
    }

    let res = await fetch(
      "https://script.google.com/macros/s/AKfycbyIvNFICoN16ta_nxYkCfiWsBHuzZgd8v9emDRmp88TqQXadM9d0_ZpZIQRmzkof6dKMQ/exec",
      {
        method: "POST",
        body: JSON.stringify({
          name: guest.name,
          seats: window.tempRSVP.companions.length + 1,
          companions: window.tempRSVP.companions.join(", "),
          status: "UPDATED"
        })
      }
    );

    let text = (await res.text()).trim();
    console.log("SAVE RESPONSE:", text);

    if (text === "UPDATED" || text === "SAVED" || text === "") {

      // 🔥 update state so UI doesn't revert
      window.currentGuest = {
        ...window.currentGuest,
        seats: window.tempRSVP.companions.length + 1,
        companions: window.tempRSVP.companions.join(", ")
      };

      showAttendanceQuestion();

    } else {
      alert("Save failed: " + text);
    }

  } catch (err) {
    console.error(err);
    alert("Unable to save guest list.");
  }
}


function showAttendanceQuestion() {
  // Wrap this screen as well to keep layout alignment matching perfectly
  let html = `
    <div class="screen-content">
      <h2>Will you attend<br>Anaiah's Onederful Day?</h2>

      <button onclick="finalAttendance('YES')">
        Yes, We Will Attend
      </button>

      <button onclick="finalAttendance('NO')">
        Sorry, We Can't Make It
      </button>
    </div>
  `;

  document.getElementById("screen").innerHTML = html;
}

async function finalAttendance(answer) {
  try {
    let guest = window.currentGuest;

    // 2. Trigger loading screen instantly when they choose Yes or No
    showLoading("Saving your RSVP...");

    let res = await fetch(
      "https://script.google.com/macros/s/AKfycbyIvNFICoN16ta_nxYkCfiWsBHuzZgd8v9emDRmp88TqQXadM9d0_ZpZIQRmzkof6dKMQ/exec",
      {
        method: "POST",
        body: JSON.stringify({
          name: guest.name,
          seats: guest.seats,
          companions: guest.companions,
          status: answer
        })
      }
    );

    await res.text();

    if (answer === "YES") {
      // Elegant, warm layout for attending guests
      document.getElementById("screen").innerHTML = `
        <h2 style="font-size: 26px; color: #5d534a; margin-bottom: 10px;">Thank You!</h2>
        <p style="font-size: 16px; color: #4a4a4a; font-weight: 500; margin-bottom: 20px;">
          Your RSVP has been confirmed.
        </p>
        
        <div style="background: rgba(255, 255, 255, 0.4); border-radius: 16px; padding: 20px; border: 1px dashed rgba(0, 0, 0, 0.08); margin-top: 15px;">
          <p style="color: #6b6b6b; font-size: 14px; line-height: 1.6; margin: 0;">
            We can't wait to celebrate <br>
            <span style="font-weight: 600; color: #5d534a; font-size: 15px;">Anaiah's 1st Birthday</span> with you!
          </p>
        </div>
      `;

    } else {
      // Thoughtful, sweet layout for guests who can't make it
      document.getElementById("screen").innerHTML = `
        <h2 style="font-size: 24px; color: #5d534a; margin-bottom: 10px;">Thank You</h2>
        <p style="font-size: 15px; color: #4a4a4a; font-weight: 500; margin-bottom: 20px;">
          Your response has been saved.
        </p>
        
        <div style="background: rgba(255, 255, 255, 0.4); border-radius: 16px; padding: 20px; border: 1px dashed rgba(0, 0, 0, 0.08); margin-top: 15px;">
          <p style="color: #6b6b6b; font-size: 14px; line-height: 1.6; margin: 0;">
            You will be missed! Thank you for sending your warm wishes for 
            <span style="font-weight: 600; color: #5d534a;">Anaiah</span>.
          </p>
        </div>
      `;
    }

  } catch (err) {
    console.error(err);
    alert("Unable to save attendance.");
  }
}

function selectAndProceed(labelElement) {
  const radioButton = labelElement.querySelector('input[type="radio"]');
  if (radioButton) {
    radioButton.checked = true;
  }
  
  // Wait 180ms so the guest sees the tile turn green before moving to the next page
  setTimeout(() => {
    confirmName();
  }, 180);
}

function showCompanionInputForm() {
  let max = window.currentGuest.seats - 1;
  // Pre-fills the input box with their current companions so they don't have to re-type everything
  let currentNames = (window.tempCompanions || []).join(", ");

  let html = `
    <h2>Edit Companions</h2>
    <p>Enter up to ${max} names separated by commas:</p>

    <input id="editList" placeholder="Name 1, Name 2" value="${currentNames}">

    <button onclick="saveEditedCompanions()">Update & Next</button>
    <button onclick="editCompanions()">Back</button>
  `;

  document.getElementById("screen").innerHTML = html;
}

// HELPER FUNCTION TO RENDER THE LOADING ANIMATION
function showLoading(message = "Loading...") {
  document.getElementById("screen").innerHTML = `
    <div class="loader-container">
      <div class="loading-spinner"></div>
      <p>${message}</p>
    </div>
  `;
}
