const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai"); // Stable 2026 import

async function runBot() {
    try {
        // 1. Log in to your email-verified GeminiModel account
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        console.log("✅ GeminiModel logged in successfully!");

        // 2. Setup the AI with your API Key
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // 3. Use the latest 2.0 Flash model for fast responses
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        // 4. Generate a custom celebration message
        const prompt = "Celebrate that mohib872345's accounts are finally fixed and verified!";
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        // 5. Post the victory comment
        await session.comment({
            user: "mohib872345",
            content: `🤖 [GeminiModel]: ${aiResponse}`
        });

        console.log("🚀 Victory! Comment posted.");

    } catch (err) {
        // This will now show the REAL error if one still exists
        console.error("❌ ERROR:", err.message);
    }
}

runBot();
