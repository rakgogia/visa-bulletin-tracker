'use strict';

const API_URL = '/api/visa-bulletin';
let bulletinData = null;
let activeCategory = 'eb3';

const CATEGORY_CONFIG = {
    eb1: {
        label: 'EB1',
        filingDateKey: 'eb1FilingDate',
        finalActionDateKey: 'eb1FinalActionDate',
        movementKey: 'eb1Movement',
        faMovementKey: 'eb1FinalActionMovement'
    },
    eb2: {
        label: 'EB2',
        filingDateKey: 'eb2FilingDate',
        finalActionDateKey: 'eb2FinalActionDate',
        movementKey: 'eb2Movement',
        faMovementKey: 'eb2FinalActionMovement'
    },
    eb3: {
        label: 'EB3',
        filingDateKey: 'date',
        finalActionDateKey: 'finalActionDate',
        movementKey: 'movement',
        faMovementKey: 'finalActionMovement'
    },
    eb5: {
        label: 'EB5',
        filingDateKey: 'eb5FilingDate',
        finalActionDateKey: 'eb5FinalActionDate',
        movementKey: 'eb5Movement',
        faMovementKey: 'eb5FinalActionMovement'
    }
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

    document.getElementById('filingSubtitle').textContent =
        `Priority date cutoffs for filing ${config.label} India visa applications`;
    document.getElementById('faSubtitle').textContent =
        `Date when USCIS makes a final determination on ${config.label} India visa applications`;

    // Helper to populate a bulletin card pair
    const populateCard = (monthId, dateId, linkId, bulletin, dateKey) => {
        document.getElementById(monthId).textContent = bulletin.month;
        document.getElementById(dateId).textContent = bulletin[dateKey];
        if (bulletin.url) {
            const link = document.getElementById(linkId);
            link.href = bulletin.url;
            link.style.display = 'inline-block';
        }
    };

    populateCard('currentMonth', 'currentDate', 'currentLink', current, config.filingDateKey);
    populateCard('upcomingMonth', 'upcomingDate', 'upcomingLink', upcoming, config.filingDateKey);
    populateCard('faCurrentMonth', 'faCurrentDate', 'faCurrentLink', current, config.finalActionDateKey);
    populateCard('faUpcomingMonth', 'faUpcomingDate', 'faUpcomingLink', upcoming, config.finalActionDateKey);

    updateMovement(bulletinData[config.movementKey], current[config.filingDateKey], upcoming[config.filingDateKey]);
    updateMovement(bulletinData[config.faMovementKey], current[config.finalActionDateKey], upcoming[config.finalActionDateKey], 'fa');
}

function updateMovement(movement, currentDate, upcomingDate, prefix) {
    const p = prefix || '';
    const getId = (name) => document.getElementById(`${p}${p ? 'M' : 'm'}ovement${name}`);

    const arrowEl = getId('Arrow');
    const textEl = getId('Text');
    const detailsEl = getId('Details');
    const indicatorEl = getId('Indicator');

    indicatorEl.className = 'movement-indicator';
    const label = prefix ? 'final action date' : 'priority date';

    const directionMap = {
        forward: {
            arrow: '↑', text: 'Moved Forward', cssClass: 'movement-forward',
            details: `<strong>Great news!</strong> The ${label} has moved forward by <strong>${movement.days} days</strong>.<br>From <strong>${currentDate}</strong> to <strong>${upcomingDate}</strong>`
        },
        backward: {
            arrow: '↓', text: 'Moved Backward', cssClass: 'movement-backward',
            details: `The ${label} has moved backward by <strong>${Math.abs(movement.days)} days</strong>.<br>From <strong>${currentDate}</strong> to <strong>${upcomingDate}</strong>`
        },
        'no change': {
            arrow: '→', text: 'No Movement', cssClass: 'movement-none',
            details: `The ${label} remains at <strong>${currentDate}</strong> with no change.`
        }
    };

    const info = directionMap[movement.direction] || directionMap['no change'];
    arrowEl.textContent = info.arrow;
    textEl.textContent = info.text;
    detailsEl.innerHTML = info.details;
    indicatorEl.classList.add(info.cssClass);
}

function updateLastUpdated(timestamp) {
    document.getElementById('lastUpdated').textContent = new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });
}

window.addEventListener('DOMContentLoaded', loadData);
