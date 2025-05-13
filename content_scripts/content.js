console.log("Content script loaded and running");

browser.runtime.onMessage.addListener(async (message) => {
  console.log("Content script received message:", message);
  if (message.action === "postNote") {
    console.log("content.js received postNote message:", message.content);

    try {
      const payload = {
        bodyJson: {
          type: "doc",
          attrs: { schemaVersion: "v1" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: message.content,
                },
              ],
            },
          ],
        },
        replyMinimumRole: "everyone",
      };

      const headers = {
        "Content-Type": "application/json",
      };

      const response = await fetch("https://substack.com/api/v1/comment/feed", {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return Promise.resolve({ success: true });
      } else {
        const errorText = await response.text();
        return Promise.resolve({
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        });
      }
    } catch (error) {
      return Promise.resolve({ success: false, error: error.message });
    }
  }
});
