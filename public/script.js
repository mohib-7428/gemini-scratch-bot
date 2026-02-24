// State management
let state = {
    isRunning: false,
    uptime: 0,
    totalReplies: 0,
    lastCheck: null,
    currentMonth: new Date(),
    activityData: {},
    settings: {
        checkInterval: 35,
        maxResponseLength: 450,
        aiModel: 'gemini-1.5-flash',
        customCssUrl: ''
    }
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('botSettings');
    if (saved) {
        state.settings = { ...state.settings, ...JSON.parse(saved) };
        applySettings();
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('botSettings', JSON.stringify(state.settings));
}

// Apply settings to the page
function applySettings() {
    document.getElementById('check-interval').value = state.settings.checkInterval;
    document.getElementById('max-response-length').value = state.settings.maxResponseLength;
    document.getElementById('ai-model').value = state.settings.aiModel;
    document.getElementById('custom-css-url').value = state.settings.customCssUrl;
    
    // Apply custom CSS
    if (state.settings.customCssUrl) {
        document.getElementById('custom-css').href = state.settings.customCssUrl;
    }
}

// Logging system
function addLog(message, type = 'info') {
    const logsContainer = document.getElementById('logs');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString();
    logEntry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
    
    logsContainer.insertBefore(logEntry, logsContainer.firstChild);
    
    // Keep only last 50 logs
    while (logsContainer.children.length > 50) {
        logsContainer.removeChild(logsContainer.lastChild);
    }
}

// Status updates
function updateStatus() {
    fetch('/api/status')
        .then(res => res.json())
        .then(data => {
            state.isRunning = data.isRunning;
            state.totalReplies = data.totalReplies || 0;
            state.lastCheck = data.lastCheck;
            state.uptime = data.uptime || 0;
            
            // Update UI
            const statusDot = document.getElementById('status-dot');
            const statusText = document.getElementById('status-text');
            
            if (state.isRunning) {
                statusDot.className = 'status-dot online';
                statusText.textContent = 'Bot Online';
            } else {
                statusDot.className = 'status-dot offline';
                statusText.textContent = 'Bot Offline';
            }
            
            document.getElementById('uptime').textContent = formatUptime(state.uptime);
            document.getElementById('total-replies').textContent = state.totalReplies;
            document.getElementById('last-check').textContent = state.lastCheck 
                ? new Date(state.lastCheck).toLocaleTimeString() 
                : 'Never';
        })
        .catch(err => {
            console.error('Failed to fetch status:', err);
            document.getElementById('status-text').textContent = 'Error checking status';
        });
}

function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Control buttons
document.getElementById('start-bot').addEventListener('click', () => {
    fetch('/api/start', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            addLog(data.message, 'success');
            updateStatus();
        })
        .catch(err => addLog('Failed to start bot: ' + err.message, 'error'));
});

document.getElementById('stop-bot').addEventListener('click', () => {
    fetch('/api/stop', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            addLog(data.message, 'warning');
            updateStatus();
        })
        .catch(err => addLog('Failed to stop bot: ' + err.message, 'error'));
});

document.getElementById('restart-bot').addEventListener('click', () => {
    fetch('/api/restart', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            addLog(data.message, 'info');
            updateStatus();
        })
        .catch(err => addLog('Failed to restart bot: ' + err.message, 'error'));
});

document.getElementById('clear-logs').addEventListener('click', () => {
    document.getElementById('logs').innerHTML = '';
    addLog('Logs cleared', 'info');
});

// Calendar functionality
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    // Update month display
    document.getElementById('current-month').textContent = 
        state.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendar.appendChild(empty);
    }
    
    // Days of month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if today
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayEl.classList.add('today');
        }
        
        // Check if has activity
        if (state.activityData[dateKey]) {
            dayEl.classList.add('has-activity');
            dayEl.title = `${state.activityData[dateKey]} replies on this day`;
        }
        
        dayEl.addEventListener('click', () => {
            const activity = state.activityData[dateKey] || 0;
            addLog(`${dateKey}: ${activity} replies`, 'info');
        });
        
        calendar.appendChild(dayEl);
    }
}

document.getElementById('prev-month').addEventListener('click', () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1);
    renderCalendar();
    loadActivityData();
});

document.getElementById('next-month').addEventListener('click', () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
    renderCalendar();
    loadActivityData();
});

function loadActivityData() {
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    fetch(`/api/activity?year=${year}&month=${month + 1}`)
        .then(res => res.json())
        .then(data => {
            state.activityData = data.activity || {};
            renderCalendar();
        })
        .catch(err => console.error('Failed to load activity data:', err));
}

// Settings form
document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    state.settings.checkInterval = parseInt(document.getElementById('check-interval').value);
    state.settings.maxResponseLength = parseInt(document.getElementById('max-response-length').value);
    state.settings.aiModel = document.getElementById('ai-model').value;
    state.settings.customCssUrl = document.getElementById('custom-css-url').value;
    
    // Save to localStorage
    saveSettings();
    
    // Apply custom CSS
    if (state.settings.customCssUrl) {
        document.getElementById('custom-css').href = state.settings.customCssUrl;
    } else {
        document.getElementById('custom-css').href = '';
    }
    
    // Send to server
    fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.settings)
    })
        .then(res => res.json())
        .then(data => {
            addLog('Settings saved successfully', 'success');
        })
        .catch(err => addLog('Failed to save settings: ' + err.message, 'error'));
});

// Initialize
loadSettings();
updateStatus();
renderCalendar();
loadActivityData();

// Auto-refresh status
setInterval(updateStatus, 5000);

// Initial log
addLog('Dashboard initialized', 'success');
