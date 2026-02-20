const API_URL = '/api/visa-bulletin';
let bulletinData = null;
let activeCategory = 'eb3';

const CATEGORY_CONFIG = {
    eb1: { label: 'EB1', filingDateKey: 'eb1FilingDate', finalActionDateKey: 'eb1FinalActionDate', movementKey: 'eb1Movement', faMovementKey: 'eb1FinalActionMovement' },
    eb2: { label: 'EB2', filingDateKey: 'eb2FilingDate', finalActionDateKey: 'eb2FinalActionDate', movementKey: 'eb2Movement', faMovementKey: 'eb2FinalActionMovement' },
    eb3: { label: 'EB3', filingDateKey: 'date', finalActionDateKey: 'finalActionDate', movementKey: 'movement', faMovementKey: 'finalActionMovement' },
    eb5: { label: 'EB5', filingDateKey: 'eb5FilingDate', finalActionDateKey: 'eb5FinalActionDate', movementKey: 'eb5Movement', faMovementKey: 'eb5FinalActionMovement' }
};

async function loadData() {
    const [loading, error, content, errorMessage] = ['loading', 'error', 'content', 'errorMessage'].map(id => document.getElementById(id));
    loading.style.display = 'block';
    error.style.display = 'none';
    content.style.display = 'none';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        bulletinData = await response.json();
        renderCategory(activeCategory);
        updateLastUpdated(bulletinData.lastUpdated);
        loading.style.display = 'none';
        content.style.display = 'block';
    } catch (err) {
        console.error('Error loading data:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
        errorMessage.textContent = err.message;
    }
}

function switchCategory(category) {
    activeCategory = category;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    if (bulletinData) renderCategory(category);
}

function renderCategory(category) {
    const config = CATEGORY_CONFIG[category];
    const { current, upcoming } = bulletinData;

    // Update section subtitles
    document.getElementById('filingSubtitle').textContent = `Priority date cutoffs for filing ${config.label} India visa applications`;
    document.getElementById('faSubtitle').textContent = `Date when USCIS makes a final determination on ${config.label} India visa applications`;

    // Filing Dates - Current
    document.getElementById('currentMonth').textContent = current.month;
    document.getElementById('currentDate').textContent = current[config.filingDateKey];
    if (current.url) {
        const link = document.getElementById('currentLink');
        link.href = current.url;
        link.style.display = 'inline-block';
    }

    // Filing Dates - Upcoming
    document.getElementById('upcomingMonth').textContent = upcoming.month;
    document.getElementById('upcomingDate').textContent = upcoming[config.filingDateKey];
    if (upcoming.url) {
        const link = document.getElementById('upcomingLink');
        link.href = upcoming.url;
        link.style.display = 'inline-block';
    }

    // Final Action - Current
    document.getElementById('faCurrentMonth').textContent = current.month;
    document.getElementById('faCurrentDate').textContent = current[config.finalActionDateKey];
    if (current.url) {
        const link = document.getElementById('faCurrentLink');
        link.href = current.url;
        link.style.display = 'inline-block';
    }

    // Final Action - Upcoming
    document.getElementById('faUpcomingMonth').textContent = upcoming.month;
    document.getElementById('faUpcomingDate').textContent = upcoming[config.finalActionDateKey];
    if (upcoming.url) {
        const link = document.getElementById('faUpcomingLink');
        link.href = upcoming.url;
        link.style.display = 'inline-block';
    }

    // Filing Movement
    updateMovement(bulletinData[config.movementKey], current[config.filingDateKey], upcoming[config.filingDateKey]);

    // Final Action Movement
    updateMovement(bulletinData[config.faMovementKey], current[config.finalActionDateKey], upcoming[config.finalActionDateKey], 'fa');
}

function updateMovement(movement, currentDate, upcomingDate, prefix) {
    const ids = prefix
        ? [`${prefix}MovementArrow`, `${prefix}MovementText`, `${prefix}MovementDetails`, `${prefix}MovementIndicator`]
        : ['movementArrow', 'movementText', 'movementDetails', 'movementIndicator'];
    const [movementArrow, movementText, movementDetails, movementIndicator] = ids.map(id => document.getElementById(id));
    movementIndicator.className = 'movement-indicator';
    const label = prefix ? 'final action date' : 'priority date';
    const configs = {
        forward: ['↑', 'Moved Forward', 'movement-forward', `<strong>Great news!</strong> The ${label} has moved forward by <strong>${movement.days} days</strong>.<br>From <strong>${currentDate}</strong> to <strong>${upcomingDate}</strong>`],
        backward: ['↓', 'Moved Backward', 'movement-backward', `The ${label} has moved backward by <strong>${Math.abs(movement.days)} days</strong>.<br>From <strong>${currentDate}</strong> to <strong>${upcomingDate}</strong>`],
        none: ['→', 'No Movement', 'movement-none', `The ${label} remains at <strong>${currentDate}</strong> with no change.`]
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
