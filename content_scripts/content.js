console.log("Content script loaded and running");

browser.runtime.onMessage.addListener(async (message) => {
  if (message.action !== "postNote") return;

  // message.content: { bodyJson: {...}, replyMinimumRole, comment }
  const payload = {
    bodyJson: message.content.bodyJson,
    replyMinimumRole: message.content.replyMinimumRole,
    comment: message.content.comment,
  };

  console.log("Posting Note payload:", payload);

  try {
    const response = await fetch("https://substack.com/api/v1/comment/feed", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("Note posted successfully.");
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error("Failed to post note:", response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    console.error("Error posting note:", error);
    return { success: false, error: error.message };
  }
});
