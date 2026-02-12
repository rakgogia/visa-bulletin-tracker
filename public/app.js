const API_URL = 'http://localhost:3000/api/visa-bulletin';

async function loadData() {
    const [loading, error, content, errorMessage] = ['loading', 'error', 'content', 'errorMessage'].map(id => document.getElementById(id));
    loading.style.display = 'block';
    error.style.display = 'none';
    content.style.display = 'none';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        updateCurrentBulletin(data.current);
        updateUpcomingBulletin(data.upcoming);
        updateMovement(data.movement, data.current.date, data.upcoming.date);
        updateLastUpdated(data.lastUpdated);
        loading.style.display = 'none';
        content.style.display = 'block';
    } catch (err) {
        console.error('Error loading data:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
        errorMessage.textContent = err.message;
    }
}

function updateBulletin(bulletin, prefix) {
    document.getElementById(`${prefix}Month`).textContent = bulletin.month;
    document.getElementById(`${prefix}Date`).textContent = bulletin.date;
    if (bulletin.url) {
        const link = document.getElementById(`${prefix}Link`);
        link.href = bulletin.url;
        link.style.display = 'inline-block';
    }
}

const updateCurrentBulletin = (bulletin) => updateBulletin(bulletin, 'current');
const updateUpcomingBulletin = (bulletin) => updateBulletin(bulletin, 'upcoming');

function updateMovement(movement, currentDate, upcomingDate) {
    const [movementArrow, movementText, movementDetails, movementIndicator] = ['movementArrow', 'movementText', 'movementDetails', 'movementIndicator'].map(id => document.getElementById(id));
    movementIndicator.className = 'movement-indicator';
    const configs = {
        forward: ['↑', 'Moved Forward', 'movement-forward', `<strong>Great news!</strong> The priority date has moved forward by <strong>${movement.days} days</strong>.<br>From <strong>${currentDate}</strong> to <strong>${upcomingDate}</strong>`],
        backward: ['↓', 'Moved Backward', 'movement-backward', `The priority date has moved backward by <strong>${Math.abs(movement.days)} days</strong>.<br>From <strong>${currentDate}</strong> to <strong>${upcomingDate}</strong>`],
        none: ['→', 'No Movement', 'movement-none', `The priority date remains at <strong>${currentDate}</strong> with no change.`]
    };
    const config = configs[movement.direction] || configs.none;
    [movementArrow.textContent, movementText.textContent, , movementDetails.innerHTML] = config;
    movementIndicator.classList.add(config[2]);
}

function updateLastUpdated(timestamp) {
    document.getElementById('lastUpdated').textContent = new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });
}

window.addEventListener('DOMContentLoaded', loadData);
