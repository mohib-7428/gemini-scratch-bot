const http = require('http');
const fs = require('fs');
const path = require('path');
const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Bot state
let botState = {
    isRunning: false,
    totalReplies: 0,
    lastCheck: null,
    startTime: Date.now(),
    activityData: {},
    settings: {
        checkInterval: 35,
        maxResponseLength: 450,
        aiModel: 'gemini-1.5-flash'
    }
};

let model = genAI.getGenerativeModel({ model: botState.settings.aiModel });
let lastCheckedCommentId = null;
let botInterval = null;
let session = null;

// Check for comments
async function checkComments() {
    if (!session || !botState.isRunning) return;
    
    try {
        const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/GeminiModel/?cachebust=${Date.now()}`);
        const html = await response.text();
        const match = /<div id="comments-(\d+)"[\s\S]*?<div class="content">([\s\S]*?)<\/div>/.exec(html);

        botState.lastCheck = Date.now();

        if (match) {
            const [_, commentId, text] = match;
            if (text.toLowerCase().includes("!ask") && commentId !== lastCheckedCommentId) {
                lastCheckedCommentId = commentId;
                console.log(`🎯 New Prompt: ${text.trim()}`);

                try {
                    const prompt = text.split(/!ask/i)[1].trim();
                    
                    // RAW AI Generation
                    const result = await model.generateContent(prompt);
                    const aiResponse = result.response.text().substring(0, botState.settings.maxResponseLength);
                    
                    await session.comment({ 
                        user: "GeminiModel", 
                        content: `🤖 ${aiResponse}`, 
                        parent: commentId 
                    });
                    
                    botState.totalReplies++;
                    
                    // Track activity by date
                    const dateKey = new Date().toISOString().split('T')[0];
                    botState.activityData[dateKey] = (botState.activityData[dateKey] || 0) + 1;
                    
                    console.log("✨ SUCCESS: Reply posted.");
                } catch (aiErr) {
                    console.log(`❌ AI ERROR: ${aiErr.message}`);
                }
            }
        }
    } catch (e) {
        console.error('Check error:', e.message);
    }
}

// Start bot
async function startBot() {
    if (botState.isRunning) {
        return { success: false, message: 'Bot is already running' };
    }
    
    try {
        if (!session) {
            session = await Scratch.UserSession.create(process.env.BOT_USERNAME, process.env.BOT_PASSWORD);
        }
        
        botState.isRunning = true;
        botState.startTime = Date.now();
        console.log("✅ Scratch Connection: ACTIVE");
        
        botInterval = setInterval(checkComments, botState.settings.checkInterval * 1000);
        
        return { success: true, message: 'Bot started successfully' };
    } catch (e) {
        console.log("❌ LOGIN FAILED: Check Scratch credentials.");
        return { success: false, message: 'Failed to login to Scratch' };
    }
}

// Stop bot
function stopBot() {
    if (!botState.isRunning) {
        return { success: false, message: 'Bot is not running' };
    }
    
    botState.isRunning = false;
    if (botInterval) {
        clearInterval(botInterval);
        botInterval = null;
    }
    
    return { success: true, message: 'Bot stopped' };
}

// Restart bot
async function restartBot() {
    stopBot();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await startBot();
}

// HTTP Server with routing
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // API Routes
    if (url.pathname === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            isRunning: botState.isRunning,
            totalReplies: botState.totalReplies,
            lastCheck: botState.lastCheck,
            uptime: botState.isRunning ? Math.floor((Date.now() - botState.startTime) / 1000) : 0
        }));
        return;
    }
    
    if (url.pathname === '/api/start' && req.method === 'POST') {
        const result = await startBot();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
    }
    
    if (url.pathname === '/api/stop' && req.method === 'POST') {
        const result = stopBot();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
    }
    
    if (url.pathname === '/api/restart' && req.method === 'POST') {
        const result = await restartBot();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
    }
    
    if (url.pathname === '/api/activity') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ activity: botState.activityData }));
        return;
    }
    
    if (url.pathname === '/api/settings' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const settings = JSON.parse(body);
                botState.settings = { ...botState.settings, ...settings };
                
                // Update model if changed
                model = genAI.getGenerativeModel({ model: botState.settings.aiModel });
                
                // Restart interval if running
                if (botState.isRunning && botInterval) {
                    clearInterval(botInterval);
                    botInterval = setInterval(checkComments, botState.settings.checkInterval * 1000);
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Settings updated' }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid settings' }));
            }
        });
        return;
    }
    
    // Static file serving
    let filePath = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
    
    const extname = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
    };
    
    const contentType = contentTypes[extname] || 'text/plain';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(process.env.PORT || 8080, () => {
    console.log(`🌐 Server running on port ${process.env.PORT || 8080}`);
    console.log('📊 Dashboard: http://localhost:' + (process.env.PORT || 8080));
});

// Auto-start bot
startBot();
