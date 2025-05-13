// Utility function to generate a simple unique ID
function generateId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

const form = document.getElementById("schedule-form");
const noteContentInput = document.getElementById("note-content");
const scheduleTimeInput = document.getElementById("schedule-time");
const scheduledNotesList = document.getElementById("scheduled-notes-list");

// Load and render scheduled notes on popup open
async function loadScheduledNotes() {
  const result = await browser.storage.local.get("scheduledNotes");
  const notes = result.scheduledNotes || [];
  renderScheduledNotes(notes);
}

// Render the scheduled notes list
function renderScheduledNotes(notes) {
  scheduledNotesList.innerHTML = "";

  if (notes.length === 0) {
    scheduledNotesList.innerHTML = "<li>No scheduled notes.</li>";
    return;
  }

  notes.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = `${new Date(
      note.scheduledTime
    ).toLocaleString()}: ${note.content.substring(0, 50)}${
      note.content.length > 50 ? "..." : ""
    }`;

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.marginLeft = "10px";
    delBtn.addEventListener("click", () => deleteScheduledNote(note.id));

    li.appendChild(delBtn);
    scheduledNotesList.appendChild(li);
  });
}

// Save a new scheduled note
async function saveScheduledNote(note) {
  const result = await browser.storage.local.get("scheduledNotes");
  const notes = result.scheduledNotes || [];
  notes.push(note);
  await browser.storage.local.set({ scheduledNotes: notes });
  renderScheduledNotes(notes);
}

// Delete a scheduled note by ID
async function deleteScheduledNote(id) {
  const result = await browser.storage.local.get("scheduledNotes");
  let notes = result.scheduledNotes || [];
  notes = notes.filter((note) => note.id !== id);
  await browser.storage.local.set({ scheduledNotes: notes });
  renderScheduledNotes(notes);
}

// Form submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const content = noteContentInput.value.trim();
  const scheduledTime = scheduleTimeInput.value;

  if (!content || !scheduledTime) {
    alert("Please fill in both the note content and schedule time.");
    return;
  }

  const scheduledTimestamp = new Date(scheduledTime).getTime();
  if (isNaN(scheduledTimestamp) || scheduledTimestamp <= Date.now()) {
    alert("Please select a valid future date and time.");
    return;
  }

  const newNote = {
    id: generateId(),
    content,
    scheduledTime: scheduledTimestamp,
    status: "pending",
  };

  await saveScheduledNote(newNote);

  // Clear form
  noteContentInput.value = "";
  scheduleTimeInput.value = "";
});

loadScheduledNotes();
