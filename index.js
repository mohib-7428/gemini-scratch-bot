const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai"); // Standard 2026 import

async function runBot() {
    try {
        // 1. Log in to Scratch (GeminiModel)
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        console.log("✅ Scratch login successful!");

        // 2. Setup Gemini (Correct 2026 Initialization)
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // 3. Use the latest 2026-ready model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        // 4. Generate the response
        const prompt = "Say 'The bot is finally fixed!' to mohib872345.";
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        // 5. Post to your profile
        await session.comment({
            user: "mohib872345",
            content: `🤖 [GeminiModel]: ${aiResponse}`
        });

        console.log("🚀 SUCCESS! Comment posted to mohib872345.");

    } catch (err) {
        // This helps us see exactly what went wrong in Railway logs
        console.error("❌ ERROR:", err.message);
    }
}

runBot();
