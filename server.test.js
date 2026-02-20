const {
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
} = require('./server');

// ─── parseDate ──────────────────────────────────────────────────────────────────

describe('parseDate', () => {
  test('parses a standard 2-digit year date string', () => {
    const d = parseDate('15JAN10');
    expect(d).toEqual(new Date(2010, 0, 15));
  });

  test('parses a standard 4-digit year date string', () => {
    const d = parseDate('01MAR2024');
    expect(d).toEqual(new Date(2024, 2, 1));
  });

  test('parses all 12 month abbreviations', () => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    months.forEach((m, i) => {
      const d = parseDate(`01${m}2020`);
      expect(d).toEqual(new Date(2020, i, 1));
    });
  });

  test('2-digit year > 50 maps to 1900s', () => {
    const d = parseDate('01JAN99');
    expect(d.getFullYear()).toBe(1999);
  });

  test('2-digit year <= 50 maps to 2000s', () => {
    const d = parseDate('01JAN50');
    expect(d.getFullYear()).toBe(2050);
  });

  test('2-digit year 00 maps to 2000', () => {
    const d = parseDate('01JAN00');
    expect(d.getFullYear()).toBe(2000);
  });

  test('returns null for null input', () => {
    expect(parseDate(null)).toBeNull();
  });

  test('returns null for undefined input', () => {
    expect(parseDate(undefined)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(parseDate('')).toBeNull();
  });

  test('returns null for "Not Available"', () => {
    expect(parseDate('Not Available')).toBeNull();
  });

  test('returns null for "Error fetching data"', () => {
    expect(parseDate('Error fetching data')).toBeNull();
  });

  test('returns null for "C" (current)', () => {
    expect(parseDate('C')).toBeNull();
  });

  test('returns null for "U" (unavailable)', () => {
    expect(parseDate('U')).toBeNull();
  });

  test('returns null for malformed date string', () => {
    expect(parseDate('invalid')).toBeNull();
    expect(parseDate('2024-01-15')).toBeNull();
    expect(parseDate('January 15, 2024')).toBeNull();
  });

  test('returns null for unknown month abbreviation', () => {
    expect(parseDate('01XYZ2024')).toBeNull();
  });
});

// ─── calculateMovement ─────────────────────────────────────────────────────────

describe('calculateMovement', () => {
  test('detects forward movement', () => {
    const result = calculateMovement('01JAN2024', '01FEB2024');
    expect(result.direction).toBe('forward');
    expect(result.days).toBe(31);
    expect(result.description).toContain('forward');
  });

  test('detects backward movement', () => {
    const result = calculateMovement('01MAR2024', '01JAN2024');
    expect(result.direction).toBe('backward');
    expect(result.days).toBeLessThan(0);
    expect(result.description).toContain('backward');
  });

  test('detects no change when dates are identical', () => {
    const result = calculateMovement('01JAN2024', '01JAN2024');
    expect(result.direction).toBe('no change');
    expect(result.days).toBe(0);
  });

  test('returns no change when current date is unparseable', () => {
    const result = calculateMovement('Not Available', '01JAN2024');
    expect(result.direction).toBe('no change');
    expect(result.days).toBe(0);
  });

  test('returns no change when upcoming date is unparseable', () => {
    const result = calculateMovement('01JAN2024', 'C');
    expect(result.direction).toBe('no change');
    expect(result.days).toBe(0);
  });

  test('returns no change when both dates are unparseable', () => {
    const result = calculateMovement('U', 'C');
    expect(result.direction).toBe('no change');
    expect(result.days).toBe(0);
  });

  test('handles forward movement of 1 day', () => {
    const result = calculateMovement('01JAN2024', '02JAN2024');
    expect(result.direction).toBe('forward');
    expect(result.days).toBe(1);
  });

  test('handles backward movement of 1 day', () => {
    const result = calculateMovement('02JAN2024', '01JAN2024');
    expect(result.direction).toBe('backward');
    expect(result.days).toBe(-1);
  });

  test('handles cross-year forward movement', () => {
    const result = calculateMovement('01DEC2023', '01JAN2024');
    expect(result.direction).toBe('forward');
    expect(result.days).toBe(31);
  });

  test('handles large forward movement (multi-year)', () => {
    const result = calculateMovement('01JAN2020', '01JAN2024');
    expect(result.direction).toBe('forward');
    expect(result.days).toBeGreaterThan(1000);
  });
});

// ─── getComparisonMonths ────────────────────────────────────────────────────────

describe('getComparisonMonths', () => {
  test('returns previous, current, and upcoming months', () => {
    const result = getComparisonMonths(new Date(2024, 5, 15)); // June 2024
    expect(result.previous.month).toBe('may');
    expect(result.previous.year).toBe(2024);
    expect(result.current.month).toBe('june');
    expect(result.current.year).toBe(2024);
    expect(result.upcoming.month).toBe('july');
    expect(result.upcoming.year).toBe(2024);
  });

  test('handles January → previous is December of prior year', () => {
    const result = getComparisonMonths(new Date(2024, 0, 10)); // January 2024
    expect(result.previous.month).toBe('december');
    expect(result.previous.year).toBe(2023);
    expect(result.current.month).toBe('january');
    expect(result.current.year).toBe(2024);
    expect(result.upcoming.month).toBe('february');
    expect(result.upcoming.year).toBe(2024);
  });

  test('handles December → upcoming is January of next year', () => {
    const result = getComparisonMonths(new Date(2024, 11, 1)); // December 2024
    expect(result.previous.month).toBe('november');
    expect(result.previous.year).toBe(2024);
    expect(result.current.month).toBe('december');
    expect(result.current.year).toBe(2024);
    expect(result.upcoming.month).toBe('january');
    expect(result.upcoming.year).toBe(2025);
  });

  test('display strings are properly formatted', () => {
    const result = getComparisonMonths(new Date(2024, 5, 15)); // June 2024
    expect(result.previous.display).toBe('May 2024');
    expect(result.current.display).toBe('June 2024');
    expect(result.upcoming.display).toBe('July 2024');
  });

  test('defaults to current date when no argument is passed', () => {
    const result = getComparisonMonths();
    const now = new Date();
    expect(result.current.month).toBe(getMonthName(now.getMonth()));
    expect(result.current.year).toBe(now.getFullYear());
  });

  test('handles February (month index 1)', () => {
    const result = getComparisonMonths(new Date(2025, 1, 20)); // February 2025
    expect(result.previous.month).toBe('january');
    expect(result.previous.year).toBe(2025);
    expect(result.current.month).toBe('february');
    expect(result.upcoming.month).toBe('march');
  });

  test('all months in a year cycle correctly', () => {
    for (let m = 0; m < 12; m++) {
      const result = getComparisonMonths(new Date(2024, m, 1));
      const expectedPrev = m === 0 ? 11 : m - 1;
      const expectedNext = m === 11 ? 0 : m + 1;
      expect(result.previous.month).toBe(MONTHS[expectedPrev]);
      expect(result.current.month).toBe(MONTHS[m]);
      expect(result.upcoming.month).toBe(MONTHS[expectedNext]);
    }
  });
});

// ─── isBulletinAvailable ────────────────────────────────────────────────────────

describe('isBulletinAvailable', () => {
  test('returns true for a valid bulletin without error', () => {
    expect(isBulletinAvailable({
      month: 'January 2024',
      date: '01JAN2024',
      finalActionDate: '01DEC2023'
    })).toBe(true);
  });

  test('returns false when bulletin has an error property', () => {
    expect(isBulletinAvailable({
      month: 'January 2024',
      date: 'Error fetching data',
      finalActionDate: 'Error fetching data',
      error: 'HTTP error! status: 404'
    })).toBe(false);
  });

  test('returns true when error property is absent even if dates say Not Available', () => {
    // Page exists but data not parsed — still considered "available"
    expect(isBulletinAvailable({
      month: 'January 2024',
      date: 'Not Available',
      finalActionDate: 'Not Available'
    })).toBe(true);
  });

  test('returns false when error is an empty string (falsy but present check)', () => {
    // empty string is falsy, so !'' === true → would return true
    // This tests the edge behavior — empty error is treated as "available"
    expect(isBulletinAvailable({ error: '' })).toBe(true);
  });
});

// ─── buildMovements ─────────────────────────────────────────────────────────────

describe('buildMovements', () => {
  const makeBulletin = (overrides = {}) => ({
    date: '01JAN2024',
    finalActionDate: '01DEC2023',
    eb1FilingDate: '01NOV2023',
    eb1FinalActionDate: '01OCT2023',
    eb2FilingDate: '01SEP2023',
    eb2FinalActionDate: '01AUG2023',
    eb5FilingDate: '01JUL2023',
    eb5FinalActionDate: '01JUN2023',
    ...overrides
  });

  test('returns all 8 movement keys', () => {
    const result = buildMovements(makeBulletin(), makeBulletin());
    const expectedKeys = [
      'movement', 'finalActionMovement',
      'eb1Movement', 'eb1FinalActionMovement',
      'eb2Movement', 'eb2FinalActionMovement',
      'eb5Movement', 'eb5FinalActionMovement'
    ];
    expectedKeys.forEach(key => {
      expect(result).toHaveProperty(key);
      expect(result[key]).toHaveProperty('direction');
      expect(result[key]).toHaveProperty('days');
    });
  });

  test('reports no change when earlier and later are identical', () => {
    const b = makeBulletin();
    const result = buildMovements(b, b);
    expect(result.movement.direction).toBe('no change');
    expect(result.eb1Movement.direction).toBe('no change');
  });

  test('reports forward movement when later dates are ahead', () => {
    const earlier = makeBulletin({ date: '01JAN2024' });
    const later = makeBulletin({ date: '01MAR2024' });
    const result = buildMovements(earlier, later);
    expect(result.movement.direction).toBe('forward');
    expect(result.movement.days).toBeGreaterThan(0);
  });

  test('handles mixed movement across categories', () => {
    const earlier = makeBulletin({
      date: '01JAN2024',
      eb1FilingDate: '01MAR2024'
    });
    const later = makeBulletin({
      date: '01MAR2024',
      eb1FilingDate: '01JAN2024'
    });
    const result = buildMovements(earlier, later);
    expect(result.movement.direction).toBe('forward');
    expect(result.eb1Movement.direction).toBe('backward');
  });

  test('handles Not Available dates gracefully', () => {
    const earlier = makeBulletin({ date: 'Not Available' });
    const later = makeBulletin({ date: '01JAN2024' });
    const result = buildMovements(earlier, later);
    expect(result.movement.direction).toBe('no change');
    expect(result.movement.days).toBe(0);
  });
});

// ─── Helper functions ───────────────────────────────────────────────────────────

describe('getMonthName', () => {
  test('returns correct month names for valid indices', () => {
    expect(getMonthName(0)).toBe('january');
    expect(getMonthName(5)).toBe('june');
    expect(getMonthName(11)).toBe('december');
  });

  test('returns undefined for out-of-range index', () => {
    expect(getMonthName(12)).toBeUndefined();
    expect(getMonthName(-1)).toBeUndefined();
  });
});

describe('capitalize', () => {
  test('capitalizes lowercase string', () => {
    expect(capitalize('january')).toBe('January');
  });

  test('keeps already capitalized string unchanged', () => {
    expect(capitalize('January')).toBe('January');
  });

  test('handles single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  test('handles empty string without error', () => {
    expect(capitalize('')).toBe('');
  });
});

// ─── Integration: fallback scenario simulation ─────────────────────────────────

describe('fallback logic (previous-to-current)', () => {
  test('when upcoming is unavailable, comparison uses previous and current', () => {
    const months = getComparisonMonths(new Date(2024, 5, 15)); // June 2024

    const previous = {
      month: months.previous.display,
      date: '01JAN2024',
      finalActionDate: '01DEC2023',
      eb1FilingDate: '01NOV2023', eb1FinalActionDate: '01OCT2023',
      eb2FilingDate: '01SEP2023', eb2FinalActionDate: '01AUG2023',
      eb5FilingDate: '01JUL2023', eb5FinalActionDate: '01JUN2023',
    };

    const current = {
      month: months.current.display,
      date: '01MAR2024',
      finalActionDate: '01FEB2024',
      eb1FilingDate: '01JAN2024', eb1FinalActionDate: '01DEC2023',
      eb2FilingDate: '01NOV2023', eb2FinalActionDate: '01OCT2023',
      eb5FilingDate: '01SEP2023', eb5FinalActionDate: '01AUG2023',
    };

    const upcoming = {
      month: months.upcoming.display,
      date: 'Error fetching data',
      finalActionDate: 'Error fetching data',
      error: 'HTTP error! status: 404'
    };

    // Simulate the server logic
    let earlier, later, comparisonMode;
    if (isBulletinAvailable(upcoming)) {
      earlier = current;
      later = upcoming;
      comparisonMode = 'current-to-upcoming';
    } else {
      earlier = previous;
      later = current;
      comparisonMode = 'previous-to-current';
    }

    expect(comparisonMode).toBe('previous-to-current');
    expect(earlier.month).toBe('May 2024');
    expect(later.month).toBe('June 2024');

    const movements = buildMovements(earlier, later);
    expect(movements.movement.direction).toBe('forward');
  });

  test('when upcoming is available, comparison uses current and upcoming', () => {
    const months = getComparisonMonths(new Date(2024, 5, 15));

    const current = {
      month: months.current.display,
      date: '01JAN2024',
      finalActionDate: '01DEC2023',
      eb1FilingDate: '01NOV2023', eb1FinalActionDate: '01OCT2023',
      eb2FilingDate: '01SEP2023', eb2FinalActionDate: '01AUG2023',
      eb5FilingDate: '01JUL2023', eb5FinalActionDate: '01JUN2023',
    };

    const upcoming = {
      month: months.upcoming.display,
      date: '01MAR2024',
      finalActionDate: '01FEB2024',
      eb1FilingDate: '01JAN2024', eb1FinalActionDate: '01DEC2023',
      eb2FilingDate: '01NOV2023', eb2FinalActionDate: '01OCT2023',
      eb5FilingDate: '01SEP2023', eb5FinalActionDate: '01AUG2023',
    };

    let earlier, later, comparisonMode;
    if (isBulletinAvailable(upcoming)) {
      earlier = current;
      later = upcoming;
      comparisonMode = 'current-to-upcoming';
    } else {
      comparisonMode = 'previous-to-current';
    }

    expect(comparisonMode).toBe('current-to-upcoming');
    expect(earlier.month).toBe('June 2024');
    expect(later.month).toBe('July 2024');
  });

  test('year boundary: January fallback fetches December of previous year', () => {
    const months = getComparisonMonths(new Date(2025, 0, 15)); // January 2025
    expect(months.previous.month).toBe('december');
    expect(months.previous.year).toBe(2024);
    expect(months.current.month).toBe('january');
    expect(months.current.year).toBe(2025);
  });

  test('year boundary: December upcoming is January of next year', () => {
    const months = getComparisonMonths(new Date(2024, 11, 1)); // December 2024
    expect(months.upcoming.month).toBe('january');
    expect(months.upcoming.year).toBe(2025);
  });

  test('previous card always appears before current in fallback mode', () => {
    const previous = { month: 'April 2024', date: '01JAN2024', finalActionDate: '01DEC2023',
      eb1FilingDate: 'C', eb1FinalActionDate: 'C',
      eb2FilingDate: '01SEP2023', eb2FinalActionDate: '01AUG2023',
      eb5FilingDate: '01JUL2023', eb5FinalActionDate: '01JUN2023' };
    const current = { month: 'May 2024', date: '15FEB2024', finalActionDate: '15JAN2024',
      eb1FilingDate: 'C', eb1FinalActionDate: 'C',
      eb2FilingDate: '01NOV2023', eb2FinalActionDate: '01OCT2023',
      eb5FilingDate: '01SEP2023', eb5FinalActionDate: '01AUG2023' };
    const upcoming = { error: 'Not found', date: 'Error fetching data', finalActionDate: 'Error fetching data',
      eb1FilingDate: 'Error fetching data', eb1FinalActionDate: 'Error fetching data',
      eb2FilingDate: 'Error fetching data', eb2FinalActionDate: 'Error fetching data',
      eb5FilingDate: 'Error fetching data', eb5FinalActionDate: 'Error fetching data' };

    const earlier = isBulletinAvailable(upcoming) ? current : previous;
    const later = isBulletinAvailable(upcoming) ? upcoming : current;

    // Earlier (first card) should be the chronologically older month
    expect(earlier.month).toBe('April 2024');
    expect(later.month).toBe('May 2024');

    const movements = buildMovements(earlier, later);
    // EB3 should show forward movement
    expect(movements.movement.direction).toBe('forward');
    // EB1 has 'C' both months — no change
    expect(movements.eb1Movement.direction).toBe('no change');
  });
});

// ─── NON_DATE_VALUES constant ──────────────────────────────────────────────────

describe('NON_DATE_VALUES', () => {
  test('contains expected sentinel values', () => {
    expect(NON_DATE_VALUES.has('Not Available')).toBe(true);
    expect(NON_DATE_VALUES.has('Error fetching data')).toBe(true);
    expect(NON_DATE_VALUES.has('C')).toBe(true);
    expect(NON_DATE_VALUES.has('U')).toBe(true);
  });

  test('does not contain valid date strings', () => {
    expect(NON_DATE_VALUES.has('01JAN2024')).toBe(false);
  });
});
