const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai");

async function runBot() {
    try {
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log(`🤖 GeminiModel checking for tasks...`);
        
        const result = await model.generateContent("Write a tiny 5-word greeting for mohib872345.");
        await session.comment({
            user: "mohib872345",
            content: result.response.text()
        });

        console.log("✅ Comment posted.");

    } catch (err) {
        console.error("❌ Error:", err.message);
    }

    // --- THE RANDOM TIMER LOGIC ---
    // 30,000ms = 30 seconds (Minimum allowed for New Scratchers)
    // 60,000ms = 1 minute (Your requested max)
    const nextDelay = Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000;
    
    console.log(`⏳ Next comment in ${nextDelay / 1000} seconds...`);
    setTimeout(runBot, nextDelay);
}

// Start the first run
runBot();
