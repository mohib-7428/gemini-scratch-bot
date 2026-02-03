const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai");

async function startBot() {
    try {
        console.log("🚀 Attempting to bypass Scratch shield...");
        
        // LOGIN (With a slight delay to look human)
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("✅ SUCCESS! Inside the Scratch servers.");

        // THE LOOP
        setInterval(async () => {
            try {
                const user = "mohib872345";
                const comments = await session.getComments(user);
                const latest = comments[0];

                if (latest && latest.content.startsWith("!ask") && latest.author.username !== process.env.BOT_USERNAME) {
                    console.log("💬 Command found!");
                    
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash-lite",
                        contents: `Reply to: "${latest.content}" in 10 words.`
                    });

                    await session.comment({
                        user: user,
                        content: `🤖 @${latest.author.username} ${response.text}`,
                        parent: latest.id
                    });
                    console.log("🚀 Reply posted!");
                }
            } catch (err) {
                // If we get "Servers are down" here, we just stay quiet and wait.
                if (err.message.includes("down")) {
                    console.log("😴 Scratch is sleeping (Rate Limited). Waiting...");
                } else {
                    console.error("⚠️ Loop Error:", err.message);
                }
            }
        }, 180000); // 3 MINUTES (Much safer for new bots in 2026)

    } catch (err) {
        console.error("❌ Login Failed:", err.message);
        console.log("⏳ Waiting 5 minutes before Railway restarts...");
        // This stops the "Error Stack" by making the bot wait before crashing
        await new Promise(resolve => setTimeout(resolve, 300000));
        process.exit(1); 
    }
}

startBot();
