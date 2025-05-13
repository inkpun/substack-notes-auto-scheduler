console.log("Content script loaded and running");

browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === "postNote") {
    console.log("content.js received postNote message:", message.content);

    // Split content by line breaks into paragraphs, ignoring empty lines
    const paragraphs = message.content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Create paragraph nodes for each line
    const contentNodes = paragraphs.map((text) => ({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: text,
        },
      ],
    }));

    const payload = {
      bodyJson: {
        type: "doc",
        attrs: { schemaVersion: "v1" },
        content: contentNodes,
      },
      replyMinimumRole: "everyone",
    };

    const headers = {
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch("https://substack.com/api/v1/comment/feed", {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("Note posted successfully.");
        return Promise.resolve({ success: true });
      } else {
        const errorText = await response.text();
        console.error("Failed to post note:", response.status, errorText);
        return Promise.resolve({
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        });
      }
    } catch (error) {
      console.error("Error posting note:", error);
      return Promise.resolve({ success: false, error: error.message });
    }
  }
});
