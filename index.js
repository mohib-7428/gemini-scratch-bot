const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai");

async function checkComments() {
    try {
        const session = await Scratch.UserSession.create(process.env.BOT_USERNAME, process.env.BOT_PASSWORD);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // 1. Fetch your profile comments
        const user = "mohib872345";
        const profile = await session.getUser(user);
        const comments = await profile.getComments();
        const latest = comments[0];

        // 2. The "Command" Logic: Only respond if the comment starts with !ask
        if (latest.content.startsWith("!ask") && latest.author.username !== process.env.BOT_USERNAME) {
            console.log(`💬 Processing command: ${latest.content}`);

            // Clean the prompt (remove the "!ask" part)
            const userPrompt = latest.content.replace("!ask", "").trim();

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-lite",
                contents: `A user on Scratch asked: "${userPrompt}". Reply as a cool bot in 15 words.`
            });

            // 3. Reply to that specific comment
            await latest.reply(`🤖 ${response.text}`);
            console.log("🚀 Reply sent!");
        } else {
            console.log("😴 Waiting for a !ask command...");
        }

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

// Check every 30 seconds
setInterval(checkComments, 30000);
checkComments();
