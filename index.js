setInterval(async () => {
            try {
                console.log("😴 Checking for new !ask comments...");
                
                // Fetch direct JSON data to bypass the profile cache
                const response = await fetch(`https://api.scratch.mit.edu/users/${process.env.BOT_USERNAME}/comments?limit=5&cachebust=${Date.now()}`);
                const comments = await response.json();
                
                if (Array.isArray(comments) && comments.length > 0) {
                    const latest = comments[0];
                    const text = latest.content || "";
                    const author = latest.author.username;

                    // This makes the bot report EVERY comment it sees, even if it's not a trigger
                    console.log(`👀 Seen comment from @${author}: "${text.substring(0, 30)}..."`);

                    if (text.toLowerCase().includes("!ask") && String(latest.id) !== String(lastCheckedCommentId)) {
                        // THIS IS WHAT YOU ASKED FOR:
                        console.log(`🎯 Comment Found: (${text})`);
                        lastCheckedCommentId = latest.id;

                        console.log(`🤖 Asking Gemini to respond...`);
                        const result = await model.generateContent(text.replace(/!ask/i, "").trim());
                        const responseAI = await result.response;
                        const answer = responseAI.text().substring(0, 400);

                        console.log("📤 Posting reply to Scratch...");
                        await session.comment({
                            user: process.env.BOT_USERNAME,
                            content: `🤖 @${author} ${answer}`,
                            parent: latest.id
                        });
                        console.log("✅ SUCCESS: Reply posted!");
                    }
                } else {
                    console.log("❓ API returned 0 comments. Check BOT_USERNAME variable!");
                }
            } catch (err) {
                console.error("❌ ERROR DURING CHECK:", err.message);
            }
        }, 45000); // 45 seconds is safe to avoid Scratch rate limits
