// Utility: generate a simple unique ID
function generateId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

// Grab DOM elements
const form = document.getElementById("schedule-form");
const editor = document.getElementById("rt-editor");
const toolbar = document.getElementById("rt-toolbar");
const linkBtn = document.getElementById("link-btn");
const scheduleTimeInput = document.getElementById("schedule-time");
const scheduledNotesList = document.getElementById("scheduled-notes-list");

// Rich-text toolbar wiring
toolbar.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const cmd = btn.dataset.cmd;
  if (cmd) {
    document.execCommand(cmd, false, null);
    editor.focus();
  }
});
linkBtn.addEventListener("click", () => {
  const url = prompt("Enter link URL:");
  if (url) {
    document.execCommand("createLink", false, url);
    editor.focus();
  }
});

// Load & render scheduled notes
async function loadScheduledNotes() {
  const { scheduledNotes = [] } = await browser.storage.local.get(
    "scheduledNotes"
  );
  renderScheduledNotes(scheduledNotes);
}

// Render list with safe preview
function renderScheduledNotes(notes) {
  scheduledNotesList.innerHTML = "";
  if (notes.length === 0) {
    scheduledNotesList.innerHTML = "<li>No scheduled notes.</li>";
    return;
  }
  notes.forEach((note) => {
    const li = document.createElement("li");
    const docObj = note.content;
    const preview = (docObj.content || [])
      .map((b) => (b.content || []).map((t) => t.text).join(""))
      .join("\n");
    li.textContent = `${new Date(note.scheduledTime).toLocaleString()}: ${
      preview.substring(0, 50) + (preview.length > 50 ? "…" : "")
    }`;
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.marginLeft = "10px";
    delBtn.addEventListener("click", () => deleteScheduledNote(note.id));
    li.appendChild(delBtn);
    scheduledNotesList.appendChild(li);
  });
}

// Save/Delete helpers
async function saveScheduledNote(note) {
  const { scheduledNotes = [] } = await browser.storage.local.get(
    "scheduledNotes"
  );
  scheduledNotes.push(note);
  await browser.storage.local.set({ scheduledNotes });
  renderScheduledNotes(scheduledNotes);
}
async function deleteScheduledNote(id) {
  const { scheduledNotes = [] } = await browser.storage.local.get(
    "scheduledNotes"
  );
  const filtered = scheduledNotes.filter((n) => n.id !== id);
  await browser.storage.local.set({ scheduledNotes: filtered });
  renderScheduledNotes(filtered);
}

// DOM → ProseMirror JSON converter (matching Substack’s schema)
function domToProse(docBody) {
  const content = [];

  docBody.childNodes.forEach((node) => {
    const name = node.nodeName;
    // Paragraphs & text
    if (name === "P" || name === "DIV" || name === "#text") {
      const textNodes = [];
      node.childNodes.forEach((child) => {
        const marks = [];
        const tag = child.nodeName;
        if (tag === "STRONG" || tag === "B") marks.push({ type: "bold" });
        if (tag === "EM" || tag === "I") marks.push({ type: "italic" });
        if (tag === "S" || tag === "STRIKE") marks.push({ type: "strike" }); // use "strike" per example
        if (tag === "A")
          marks.push({
            type: "link",
            attrs: { href: child.getAttribute("href") },
          });
        textNodes.push({ type: "text", text: child.textContent, marks });
      });
      content.push({ type: "paragraph", content: textNodes });
    }
    // Bulleted list
    else if (name === "UL") {
      const items = [];
      node.querySelectorAll("li").forEach((li) => {
        items.push({
          type: "listItem", // substack uses camelCase
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: li.textContent }],
            },
          ],
        });
      });
      content.push({ type: "bulletList", content: items });
    }
    // Numbered list
    else if (name === "OL") {
      const items = [];
      node.querySelectorAll("li").forEach((li) => {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: li.textContent }],
            },
          ],
        });
      });
      content.push({
        type: "orderedList",
        attrs: { start: 1 },
        content: items,
      });
    }
  });

  return { type: "doc", attrs: { schemaVersion: "v1" }, content };
}

// Form submit → schedule note
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const html = editor.innerHTML.trim();
  const scheduledTime = scheduleTimeInput.value;
  if (!html) return alert("Please write some content.");
  if (!scheduledTime) return alert("Please select a date/time.");
  const ts = new Date(scheduledTime).getTime();
  if (isNaN(ts) || ts <= Date.now()) return alert("Pick a future date/time.");
  const parser = new DOMParser();
  const docBody = parser.parseFromString(html, "text/html").body;
  const content = domToProse(docBody);
  const newNote = {
    id: generateId(),
    content,
    scheduledTime: ts,
    status: "pending",
  };
  await saveScheduledNote(newNote);
  editor.innerHTML = "";
  scheduleTimeInput.value = "";
});

loadScheduledNotes();
