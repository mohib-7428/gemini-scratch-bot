const http = require('http');
const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. HEARTBEAT SERVER (Fixes Railway SIGTERM)
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Bot is Online');
    res.end();
}).listen(process.env.PORT || 8080);

// 2. CONFIG
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
let lastCheckedCommentId = null;

// 3. MAIN FUNCTION
async function runBot() {
    try {
        console.log("🚀 Logging into Scratch...");
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        console.log("✅ SUCCESS! Inside the Scratch servers.");

        // Loop every 2 minutes
        setInterval(async () => {
            try {
                console.log("😴 Checking for new !ask comments...");
                const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/${process.env.BOT_USERNAME}/?count=5`);
                const html = await response.text();
                
                const match = html.match(/!ask\s+([^<]+)/);
                const commentIdMatch = html.match(/id="comments-(\d+)"/);

                if (match && commentIdMatch) {
                    const question = match[1].trim();
                    const currentId = commentIdMatch[1];

                    if (currentId !== lastCheckedCommentId) {
                        console.log(`💬 New Question: ${question}`);
                        lastCheckedCommentId = currentId;

                        const result = await model.generateContent(question);
                        const answer = result.response.text().substring(0, 400);

                        await session.comment({
                            user: process.env.BOT_USERNAME,
                            content: `🤖 @${process.env.BOT_USERNAME} ${answer}`,
                            parent: currentId
                        });
                        console.log("✉️ Reply posted!");
                    }
                }
            } catch (err) {
                console.error("⚠️ Loop Error:", err.message);
            }
        }, 120000);

    } catch (error) {
        console.error("❌ Fatal Login Error:", error.message);
    }
}

runBot();
