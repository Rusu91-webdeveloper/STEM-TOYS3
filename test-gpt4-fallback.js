// Test GPT-4o directly to see if it works
const https = require("https");

async function testGPT4oDirect() {
  console.log("🧪 Testing GPT-4o directly via OpenAI API...");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ No OPENAI_API_KEY found in environment");
    return;
  }

  const postData = JSON.stringify({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Respond with exactly the word 'HELLO' and nothing else.",
      },
      {
        role: "user",
        content: "Say hello",
      },
    ],
    temperature: 1,
    max_tokens: 10,
  });

  const options = {
    hostname: "api.openai.com",
    port: 443,
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const responseData = JSON.parse(data);

          if (res.statusCode !== 200) {
            console.error("❌ OpenAI API Error:");
            console.error("- Status:", res.statusCode);
            console.error(
              "- Error:",
              responseData.error?.message || "Unknown error"
            );
            resolve();
            return;
          }

          console.log("✅ GPT-4o API Response:");
          console.log("- Success:", res.statusCode === 200);
          console.log("- Model:", responseData.model);
          console.log(
            "- Content:",
            responseData.choices?.[0]?.message?.content || "EMPTY"
          );
          console.log(
            "- Content length:",
            responseData.choices?.[0]?.message?.content?.length || 0
          );
          console.log(
            "- Finish reason:",
            responseData.choices?.[0]?.finish_reason
          );
          console.log("- Usage:", responseData.usage);

          resolve();
        } catch (error) {
          console.error("❌ JSON parse error:", error.message);
          resolve();
        }
      });
    });

    req.on("error", error => {
      console.error("❌ Request error:", error.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

testGPT4oDirect();
