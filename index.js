const http = require('http');
const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. HEARTBEAT (Keeps Railway happy)
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('GeminiModel Bot Online');
    res.end();
}).listen(process.env.PORT || 8080);

// 2. AI CONFIG (Fixed model string)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
let lastCheckedCommentId = null;
const TARGET_ACCOUNT = "GeminiModel";

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
                        console.log(`🎯 Comment Found: (${fullText})`);
                        lastCheckedCommentId = commentId;

                        const question = fullText.split(/!ask/i)[1].trim();
                        console.log(`🤖 Processing AI response for: ${question}`);

                        // API CALL
                        const result = await model.generateContent(question);
                        const aiResponse = result.response.text().substring(0, 450);

                        console.log(`📤 Sending to Scratch: ${aiResponse.substring(0, 20)}...`);
                        
                        await session.comment({
                            user: TARGET_ACCOUNT,
                            content: `🤖 ${aiResponse}`,
                            parent: commentId
                        });
                        
                        console.log("✅ SUCCESS: Reply posted to Scratch!");
                        break; 
                    }
                }
            } catch (err) {
                console.error("❌ Error:", err.message);
            }
        }, 30000); 

    } catch (error) {
        console.error("❌ Setup Failed:", error.message);
    }
}

runBot();
