setInterval(async () => {
            try {
                console.log("😴 Checking Activity Feed...");
                
                // Fetch your activity feed instead of comments
                const response = await fetch(`https://api.scratch.mit.edu/users/${process.env.BOT_USERNAME}/activity?limit=5`);
                const activities = await response.json();
                
                if (Array.isArray(activities) && activities.length > 0) {
                    // Look for the most recent comment activity
                    const latest = activities.find(a => a.type === 'addcomment');
                    
                    if (latest) {
                        const text = latest.title; // In activity feeds, the comment text is often in the title
                        console.log(`💬 Activity Found: "${text}"`);

                        if (text.toLowerCase().includes("!ask")) {
                             console.log(`🎯 Comment Found: (${text})`);
                             // ... (Rest of your Gemini logic here)
                        }
                    } else {
                        console.log("📍 No 'comment' activity found. Try posting a NEW comment now.");
                    }
                }
            } catch (err) {
                console.error("❌ Activity Error:", err.message);
            }
        }, 30000);
