setInterval(async () => {
            try {
                console.log("😴 Checking for new !ask comments...");
                
                // Fetch direct JSON data from the API (Avoids the profile cache)
                const response = await fetch(`https://api.scratch.mit.edu/users/${process.env.BOT_USERNAME}/comments?limit=10&cachebust=${Date.now()}`);
                const comments = await response.json();
                
                if (Array.isArray(comments) && comments.length > 0) {
                    // Check the most recent comment
                    const latest = comments[0];
                    const text = latest.content;

                    // Case-insensitive check for !ask
                    if (text.toLowerCase().includes("!ask") && latest.id !== lastCheckedCommentId) {
                        const question = text.split(/!ask/i)[1].trim();
                        console.log(`💬 Found Question: ${question}`);
                        lastCheckedCommentId = latest.id;

                        // Get Gemini's Answer
                        const result = await model.generateContent(question);
                        const answer = result.response.text().substring(0, 400);

                        // Reply using the session
                        await session.comment({
                            user: process.env.BOT_USERNAME,
                            content: `🤖 @${latest.author.username} ${answer}`,
                            parent: latest.id
                        });
                        console.log("✉️ Reply posted!");
                    } else {
                        console.log("📍 No new '!ask' detected in recent comments.");
                    }
                }
            } catch (err) {
                console.error("⚠️ Loop Error:", err.message);
            }
        }, 45000); // 45 seconds is safe for the API
