const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

const buildDir = path.join(__dirname, 'public_build');
app.use(express.static(buildDir));

const VISA_BULLETIN_BASE_URL = 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin';
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const getMonthName = (monthNum) => MONTHS[monthNum];
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

function getComparisonMonths(date) {
  const d = date || new Date();
  const currentMonth = d.getMonth();
  const currentYear = d.getFullYear();

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const makeInfo = (m, y) => ({ month: getMonthName(m), year: y, display: `${capitalize(getMonthName(m))} ${y}` });

  return {
    previous: makeInfo(prevMonth, prevYear),
    current: makeInfo(currentMonth, currentYear),
    upcoming: makeInfo(nextMonth, nextYear)
  };
}

function isBulletinAvailable(bulletin) {
  return !bulletin.error;
}

async function fetchVisaBulletin(month, year) {
  try {
    const url = `${VISA_BULLETIN_BASE_URL}/${year}/visa-bulletin-for-${month}-${year}.html`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const $ = cheerio.load(await response.text());

    const CATEGORY_KEYS = ['1st', '2nd', '3rd', '5th'];
    const categories = Object.fromEntries(
      CATEGORY_KEYS.map(key => [key, { filingDate: null, finalActionDate: null }])
    );

    $('table').each((_i, table) => {
      const tableText = $(table).text().toUpperCase();
      const hasRelevantData = tableText.includes('INDIA') &&
        CATEGORY_KEYS.some(key => tableText.includes(key.toUpperCase()));
      if (!hasRelevantData) return;

      const headingText = $(table).prevAll('p, h1, h2, h3, h4, h5, h6').first().text().toUpperCase();
      const isFilingDatesTable = headingText.includes('FILING');
      const isFinalActionTable = headingText.includes('FINAL ACTION') || headingText.includes('FINAL DATE');
      const rows = $(table).find('tr');

      let indiaColumnIndex = -1;
      if (rows.length > 0) {
        $(rows[0]).find('td, th').each((cellIndex, cell) => {
          const cellText = $(cell).text().trim().toUpperCase();
          if (cellText.includes('INDIA') && !cellText.includes('MAINLAND')) {
            indiaColumnIndex = cellIndex;
          }
        });
      }
      if (indiaColumnIndex === -1) return;

      const ROW_LABEL_MAP = { '1st': '1st', '2nd': '2nd', '3rd': '3rd' };

      rows.each((_rowIndex, row) => {
        const cells = $(row).find('td, th');
        const rowLabel = $(cells[0]).text().trim();
        const categoryKey = ROW_LABEL_MAP[rowLabel]
          || (rowLabel.startsWith('5th') && rowLabel.includes('Unreserved') ? '5th' : null);

        if (categoryKey && cells.length > indiaColumnIndex) {
          const dateValue = $(cells[indiaColumnIndex]).text().trim();
          if (isFilingDatesTable) {
            categories[categoryKey].filingDate = dateValue;
          } else if (isFinalActionTable || !categories[categoryKey].finalActionDate) {
            categories[categoryKey].finalActionDate = dateValue;
          }
        }
      });
    });

    const fallback = 'Not Available';
    return {
      month: `${capitalize(month)} ${year}`,
      date: categories['3rd'].filingDate || fallback,
      finalActionDate: categories['3rd'].finalActionDate || fallback,
      eb1FilingDate: categories['1st'].filingDate || fallback,
      eb1FinalActionDate: categories['1st'].finalActionDate || fallback,
      eb2FilingDate: categories['2nd'].filingDate || fallback,
      eb2FinalActionDate: categories['2nd'].finalActionDate || fallback,
      eb5FilingDate: categories['5th'].filingDate || fallback,
      eb5FinalActionDate: categories['5th'].finalActionDate || fallback,
      url
    };
  } catch (error) {
    console.error(`Error fetching bulletin for ${month} ${year}:`, error.message);
    return {
      month: `${capitalize(month)} ${year}`,
      date: 'Error fetching data',
      finalActionDate: 'Error fetching data',
      url: null,
      error: error.message
    };
  }
}

const MONTH_MAP = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
};

const NON_DATE_VALUES = new Set(['Not Available', 'Error fetching data', 'C', 'U']);

function parseDate(dateStr) {
  if (!dateStr || NON_DATE_VALUES.has(dateStr)) return null;
  const match = dateStr.match(/^(\d{2})([A-Z]{3})(\d{2,4})$/);
  if (!match) return null;
  const [, day, monthStr, yearStr] = match;
  const year = yearStr.length === 2
    ? (parseInt(yearStr) > 50 ? 1900 : 2000) + parseInt(yearStr)
    : parseInt(yearStr);
  const month = MONTH_MAP[monthStr];
  return month !== undefined ? new Date(year, month, parseInt(day)) : null;
}

function calculateMovement(currentDate, upcomingDate) {
  const current = parseDate(currentDate);
  const upcoming = parseDate(upcomingDate);
  if (!current || !upcoming) return { days: 0, direction: 'no change', description: 'No movement' };
  const diffDays = Math.floor((upcoming - current) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return { days: diffDays, direction: 'forward', description: `Moved forward ${diffDays} days` };
  if (diffDays < 0) return { days: diffDays, direction: 'backward', description: `Moved backward ${Math.abs(diffDays)} days` };
  return { days: 0, direction: 'no change', description: 'No movement' };
}

function buildMovements(earlier, later) {
  return {
    movement: calculateMovement(earlier.date, later.date),
    finalActionMovement: calculateMovement(earlier.finalActionDate, later.finalActionDate),
    eb1Movement: calculateMovement(earlier.eb1FilingDate, later.eb1FilingDate),
    eb1FinalActionMovement: calculateMovement(earlier.eb1FinalActionDate, later.eb1FinalActionDate),
    eb2Movement: calculateMovement(earlier.eb2FilingDate, later.eb2FilingDate),
    eb2FinalActionMovement: calculateMovement(earlier.eb2FinalActionDate, later.eb2FinalActionDate),
    eb5Movement: calculateMovement(earlier.eb5FilingDate, later.eb5FilingDate),
    eb5FinalActionMovement: calculateMovement(earlier.eb5FinalActionDate, later.eb5FinalActionDate)
  };
}

app.get('/api/visa-bulletin', async (req, res) => {
  try {
    const months = getComparisonMonths();
    const [cur, upc] = await Promise.all([
      fetchVisaBulletin(months.current.month, months.current.year),
      fetchVisaBulletin(months.upcoming.month, months.upcoming.year)
    ]);

    let earlier, later, comparisonMode;

    if (isBulletinAvailable(upc)) {
      earlier = cur;
      later = upc;
      comparisonMode = 'current-to-upcoming';
    } else {
      const prev = await fetchVisaBulletin(months.previous.month, months.previous.year);
      earlier = prev;
      later = cur;
      comparisonMode = 'previous-to-current';
    }

    res.json({
      current: earlier,
      upcoming: later,
      comparisonMode,
      ...buildMovements(earlier, later),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/commit-info', async (req, res) => {
  try {
    const response = await fetch('https://api.github.com/repos/rakgogia/visa-bulletin-tracker/commits?per_page=1', {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'visa-bulletin-tracker' }
    });
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    const [commit] = await response.json();
    res.json({
      sha: commit.sha.substring(0, 7),
      fullSha: commit.sha,
      message: commit.commit.message.split('\n')[0],
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url
    });
  } catch (error) {
    console.error('Error fetching commit info:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// SPA catch-all — serve React index.html for non-API routes
const reactIndex = path.join(buildDir, 'index.html');
app.get('*', (_req, res) => {
  if (fs.existsSync(reactIndex)) {
    res.sendFile(reactIndex);
  } else {
    res.status(404).send('Build not found. Run "npm run build:client" first.');
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Visa Bulletin Tracker running at http://localhost:${PORT}`));
}

module.exports = {
  app,
  parseDate,
  calculateMovement,
  getComparisonMonths,
  isBulletinAvailable,
  buildMovements,
  getMonthName,
  capitalize,
  MONTHS,
  MONTH_MAP,
  NON_DATE_VALUES
};
