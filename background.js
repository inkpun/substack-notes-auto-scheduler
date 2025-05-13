const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute
let isChecking = false;

async function checkAndPostNotes() {
  if (isChecking) {
    console.log("Previous check still running, skipping this run.");
    return;
  }
  isChecking = true;
  console.log("checkAndPostNotes started");

  try {
    const { scheduledNotes = [] } = await browser.storage.local.get(
      "scheduledNotes"
    );
    const now = Date.now();

    // Find notes pending and due
    const dueNotes = scheduledNotes.filter(
      (note) => note.status === "pending" && note.scheduledTime <= now
    );

    console.log(`Found ${dueNotes.length} due notes to post.`);

    for (const note of dueNotes) {
      try {
        console.log(`Processing note id=${note.id} with status=${note.status}`);

        // Mark as posting immediately
        note.status = "posting";
        await updateScheduledNote(note);

        // Open Substack notes page in background tab
        const tab = await browser.tabs.create({
          url: "https://substack.com/notes",
          active: false,
        });
        await waitForTabLoaded(tab.id);

        // Log before sending message
        console.log(`Sending postNote message for note id=${note.id}`);

        // Send note content to content script
        const postResult = await browser.tabs.sendMessage(tab.id, {
          action: "postNote",
          content: note.content,
        });

        if (postResult.success) {
          console.log(`Note id=${note.id} posted successfully.`);
          note.status = "posted";
        } else {
          console.warn(
            `Failed to post note id=${note.id}: ${postResult.error}. Reverting status to 'pending'.`
          );
          note.status = "pending"; // revert on failure
        }
        await updateScheduledNote(note);

        // Close the tab
        await browser.tabs.remove(tab.id);

        console.log(`Finished processing note id=${note.id}`);
      } catch (e) {
        console.error(`Error posting note id=${note.id}:`, e);
        console.warn(
          `Reverting note id=${note.id} status to 'pending' due to error.`
        );
        note.status = "pending"; // revert on error
        await updateScheduledNote(note);
      }
    }
  } finally {
    isChecking = false;
    console.log("checkAndPostNotes finished");
  }
}

// Helper: Wait for tab to finish loading
function waitForTabLoaded(tabId) {
  return new Promise((resolve) => {
    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    browser.tabs.onUpdated.addListener(listener);
  });
}

// Helper: Update a single note in storage with logging and verification
async function updateScheduledNote(updatedNote) {
  console.log(
    `Updating note id=${updatedNote.id} to status=${updatedNote.status}`
  );
  const { scheduledNotes = [] } = await browser.storage.local.get(
    "scheduledNotes"
  );
  const updatedNotes = scheduledNotes.map((note) =>
    note.id === updatedNote.id ? updatedNote : note
  );
  await browser.storage.local.set({ scheduledNotes: updatedNotes });
  console.log(`Note id=${updatedNote.id} updated in storage.`);

  // Verify update persisted by reading back
  const verify = await browser.storage.local.get("scheduledNotes");
  const noteCheck = verify.scheduledNotes.find((n) => n.id === updatedNote.id);
  console.log(`Verified note id=${updatedNote.id} status=${noteCheck.status}`);
}

// Start periodic checking
setInterval(checkAndPostNotes, CHECK_INTERVAL_MS);
checkAndPostNotes(); // run immediately on load
