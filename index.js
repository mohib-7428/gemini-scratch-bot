const http = require('http');
const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('GeminiModel Bot is LIVE');
    res.end();
}).listen(process.env.PORT || 8080);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// USING FLASH-LITE: Better free-tier stability
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" }); 
let lastCheckedCommentId = null;
const TARGET_ACCOUNT = "GeminiModel"; 

async function runBot() {
    try {
        const session = await Scratch.UserSession.create(process.env.BOT_USERNAME, process.env.BOT_PASSWORD);
        console.log("✅ Logged in! Ready for !ask commands.");

        setInterval(async () => {
            try {
                const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/${TARGET_ACCOUNT}/?cachebust=${Date.now()}`, {
                    headers: { "User-Agent": "Mozilla/5.0" }
                });
                const html = await response.text();
                const commentRegex = /<div id="comments-(\d+)"[\s\S]*?<div class="content">([\s\S]*?)<\/div>/g;
                let match;

                while ((match = commentRegex.exec(html)) !== null) {
                    const commentId = match[1];
                    const fullText = match[2].trim();

                    if (fullText.toLowerCase().includes("!ask") && commentId !== lastCheckedCommentId) {
                        console.log(`🎯 Found: ${fullText}`);
                        lastCheckedCommentId = commentId;
                        const question = fullText.split(/!ask/i)[1].trim();

                        try {
                            const result = await model.generateContent(question);
                            const aiResponse = result.response.text().substring(0, 450);
                            
                            await session.comment({
                                user: TARGET_ACCOUNT,
                                content: `🤖 ${aiResponse}`,
                                parent: commentId
                            });
                            console.log("✨ Reply posted!");
                        } catch (aiErr) {
                            console.error("⚠️ AI Quota Error. Sending fallback...");
                            await session.comment({
                                user: TARGET_ACCOUNT,
                                content: `🤖 (System: My AI brain is recharging! Try again in a minute.)`,
                                parent: commentId
                            });
                        }
                        break; 
                    }
                }
            } catch (err) { console.error("❌ Scan Error:", err.message); }
        }, 35000); // 35 seconds to avoid hitting limits
    } catch (error) { console.error("❌ Login Failure:", error.message); }
}
runBot();
