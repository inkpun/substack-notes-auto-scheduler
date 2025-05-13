# Substack Notes Auto Scheduler - Extension for Firefox

Auto-post your Substack Notes effortlessly - no fuss, no duplicates, just seamless publishing.

---

## Why You’ll Love It

- **Runs quietly in the background:** Your notes post automatically without interrupting your workflow.
- **Schedule with ease:** Write your notes and pick the perfect time. We handle the rest.
- **No duplicates:** Smart status tracking ensures each note posts exactly once.

---

## Privacy First

Your privacy matters. This extension:

- **Stores all your notes locally** in your browser - nothing leaves your device without your say-so.
- **Does not collect or share** personal data, browsing history, or credentials.
- **Posts securely** using your authenticated Substack session - no passwords stored or transmitted.

---

## Getting Started

1. Download or clone this repo.
2. In Firefox, open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select the `manifest.json` file.
4. Click the extension icon, write a note, set a future time, and schedule it.
5. Relax - your note will post automatically when the time comes.

---

## For Developers

- `background.js` manages scheduling and posting.
- `content_scripts/content.js` handles secure posting to Substack.
- Popup UI lets users schedule and manage notes.
- Uses Firefox storage API for local data persistence.

Load the extension temporarily for testing, and check the Browser Console for logs.

---

## Troubleshooting

- Duplicate posts? Ensure only one extension instance is running.
- Notes not posting? Verify your scheduled time is in the future and check console logs.
- Content script not working? Confirm manifest permissions and content script injection.

---

Enjoy effortless, private, and reliable Substack Notes scheduling - all in your browser!
