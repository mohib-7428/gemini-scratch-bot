const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/genai"); // Match this to package.json!

async function runBot() {
    try {
        // Double check your Variables in Railway are named exactly like these:
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log(`✅ GeminiModel is online!`);
        
        // Test message to your profile
        const result = await model.generateContent("Say hello to mohib872345 and tell him the bot is fixed!");
        await session.comment({
            user: "mohib872345",
            content: result.response.text()
        });

    } catch (err) {
        console.error("❌ Startup Error:", err.message);
    }
}

runBot();
