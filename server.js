const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.static('public'));

const VISA_BULLETIN_BASE_URL = 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin';
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const getMonthName = (monthNum) => MONTHS[monthNum];
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

function getCurrentAndUpcomingMonths() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const upcomingMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const upcomingYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  return {
    current: { month: getMonthName(currentMonth), year: currentYear, display: `${capitalize(getMonthName(currentMonth))} ${currentYear}` },
    upcoming: { month: getMonthName(upcomingMonth), year: upcomingYear, display: `${capitalize(getMonthName(upcomingMonth))} ${upcomingYear}` }
  };
}

async function fetchVisaBulletin(month, year) {
  try {
    const url = `${VISA_BULLETIN_BASE_URL}/${year}/visa-bulletin-for-${month}-${year}.html`;
    console.log(`Fetching: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const $ = cheerio.load(await response.text());
    let eb3IndiaDate = null;

    $('table').each((i, table) => {
      const tableText = $(table).text().toUpperCase();
      if (tableText.includes('INDIA') && tableText.includes('3RD')) {
        let indiaColumnIndex = -1;
        const isFilingDatesTable = $(table).prevAll('p, h1, h2, h3, h4, h5, h6').first().text().toUpperCase().includes('FILING');
        const rows = $(table).find('tr');
        if (rows.length > 0) {
          $(rows[0]).find('td, th').each((cellIndex, cell) => {
            const cellText = $(cell).text().trim().toUpperCase();
            if (cellText.includes('INDIA') && !cellText.includes('MAINLAND')) {
              indiaColumnIndex = cellIndex;
              console.log(`Table ${i}: Found INDIA column at index ${indiaColumnIndex}, isFilingDatesTable: ${isFilingDatesTable}`);
            }
          });
        }
        if (indiaColumnIndex !== -1) {
          rows.each((rowIndex, row) => {
            const cells = $(row).find('td, th');
            if (cells.length > indiaColumnIndex && $(cells[0]).text().trim() === '3rd') {
              const dateValue = $(cells[indiaColumnIndex]).text().trim();
              console.log(`Table ${i}: Found 3rd row with India date: ${dateValue}`);
              if (isFilingDatesTable || !eb3IndiaDate) {
                eb3IndiaDate = dateValue;
                console.log(`Using this date: ${eb3IndiaDate}`);
              }
            }
          });
        }
      }
    });

    return { month: `${capitalize(month)} ${year}`, date: eb3IndiaDate || 'Not Available', url };
  } catch (error) {
    console.error(`Error fetching bulletin for ${month} ${year}:`, error.message);
    return { month: `${capitalize(month)} ${year}`, date: 'Error fetching data', url: null, error: error.message };
  }
}

const MONTH_MAP = { 'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5, 'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11 };

function parseDate(dateStr) {
  if (!dateStr || ['Not Available', 'Error fetching data', 'C', 'U'].includes(dateStr)) return null;
  const match = dateStr.match(/(\d{2})([A-Z]{3})(\d{2,4})/);
  if (!match) return null;
  const [, day, monthStr, yearStr] = match;
  const year = yearStr.length === 2 ? (parseInt(yearStr) > 50 ? '19' + yearStr : '20' + yearStr) : yearStr;
  const month = MONTH_MAP[monthStr];
  return month !== undefined ? new Date(parseInt(year), month, parseInt(day)) : null;
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

app.get('/api/visa-bulletin', async (req, res) => {
  try {
    const { current, upcoming } = getCurrentAndUpcomingMonths();
    console.log('Fetching bulletins...');
    const [currentBulletin, upcomingBulletin] = await Promise.all([
      fetchVisaBulletin(current.month, current.year),
      fetchVisaBulletin(upcoming.month, upcoming.year)
    ]);
    res.json({
      current: currentBulletin,
      upcoming: upcomingBulletin,
      movement: calculateMovement(currentBulletin.date, upcomingBulletin.date),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Visa Bulletin Tracker running at http://localhost:${PORT}`));
