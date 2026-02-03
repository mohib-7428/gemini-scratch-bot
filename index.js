const Scratch = require('scratch3-api');
const { googleGenAI } = require("@google/genai"); // Notice the lowercase 'g'

async function runBot() {
    try {
        // 1. Log in to GeminiModel
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        
        // 2. The 2026 Initialization (No 'new' keyword!)
        const ai = googleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log(`✅ GeminiModel is authenticated!`);
        
        // 3. Generate and Post
        const result = await model.generateContent("Say 'System Online' to mohib872345.");
        const aiResponse = result.response.text();

        await session.comment({
            user: "mohib872345",
            content: aiResponse
        });

        console.log("🚀 Mission accomplished.");

    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
    }
}

runBot();
