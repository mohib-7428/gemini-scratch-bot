setInterval(async () => {
            try {
                console.log("😴 Checking for new !ask comments...");
                
                const response = await fetch(`https://api.scratch.mit.edu/users/${process.env.BOT_USERNAME}/comments?limit=5&cachebust=${Date.now()}`);
                const comments = await response.json();
                
                if (Array.isArray(comments) && comments.length > 0) {
                    const latest = comments[0];
                    const text = latest.content || "";

                    if (text.toLowerCase().includes("!ask") && String(latest.id) !== String(lastCheckedCommentId)) {
                        console.log(`🎯 Trigger Found: "${text}"`);
                        lastCheckedCommentId = latest.id;

                        const question = text.split(/!ask/i)[1].trim();
                        console.log(`🤖 Asking Gemini: ${question}`);

                        // We wrap this in a timeout so Gemini doesn't hang the whole bot
                        const result = await model.generateContent(question);
                        const responseAI = await result.response;
                        const answer = responseAI.text().substring(0, 400);

                        console.log("📤 Sending response to Scratch...");
                        await session.comment({
                            user: process.env.BOT_USERNAME,
                            content: `🤖 @${latest.author.username} ${answer}`,
                            parent: latest.id
                        });
                        console.log("✅ Done! Reply posted.");
                    }
                }
            } catch (err) {
                // This will tell us EXACTLY why it froze
                console.error("❌ ERROR DURING TRIGGER:", err.message);
                // Reset ID so it can try again if it failed
                lastCheckedCommentId = null; 
            }
        }, 30000); // 30 seconds is better for testing
