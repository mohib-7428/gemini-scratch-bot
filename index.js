const http = require('http');
const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. HEARTBEAT
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('GeminiModel Bot Online');
    res.end();
}).listen(process.env.PORT || 8080);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
let lastCheckedCommentId = null;
const TARGET_ACCOUNT = "GeminiModel"; // Targeted as requested

async function runBot() {
    try {
        console.log(`🚀 Logging in to handle ${TARGET_ACCOUNT}...`);
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        console.log("✅ Logged in successfully!");

        setInterval(async () => {
            try {
                console.log(`🧐 Scanning ${TARGET_ACCOUNT} for !ask...`);
                
                // Fetch using the site-api which is more reliable for "Chat Places"
                const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/${TARGET_ACCOUNT}/?cachebust=${Date.now()}`, {
                    headers: { "User-Agent": "Mozilla/5.0" }
                });
                const html = await response.text();
                
                // Enhanced Regex to find comment ID and Content
                const commentRegex = /<div id="comments-(\d+)"[\s\S]*?<div class="content">([\s\S]*?)<\/div>/g;
                let match;

                while ((match = commentRegex.exec(html)) !== null) {
                    const commentId = match[1];
                    const fullText = match[2].trim();

                    if (fullText.toLowerCase().includes("!ask") && commentId !== lastCheckedCommentId) {
                        console.log(`🎯 Comment Found: (${fullText})`);
                        lastCheckedCommentId = commentId;

                        const question = fullText.split(/!ask/i)[1].trim();
                        console.log(`🤖 Processing: ${question}`);

                        const result = await model.generateContent(question);
                        const aiResponse = (await result.response).text().substring(0, 400);

                        await session.comment({
                            user: TARGET_ACCOUNT,
                            content: `🤖 ${aiResponse}`,
                            parent: commentId
                        });
                        console.log("✅ Reply posted to GeminiModel!");
                        break; 
                    }
                }
            } catch (err) {
                console.error("❌ Scan Error:", err.message);
            }
        }, 30000); // 30 second check

    } catch (error) {
        console.error("❌ Setup Failed:", error.message);
    }
}

runBot();
