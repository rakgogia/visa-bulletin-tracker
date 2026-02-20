export default function InfoSection() {
  return (
    <div className="info-section">
      <div className="info-box">
        <h3>About Priority Dates</h3>
        <p>
          The priority date shown is the cutoff date for filing employment-based visa applications.
          If your priority date is earlier than the displayed date, you may be eligible to file your
          application.
        </p>
      </div>
      <div className="info-box">
        <h3>Data Source</h3>
        <p>
          All data is fetched directly from the official{' '}
          <a
            href="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            U.S. Department of State Visa Bulletin
          </a>
          .
        </p>
      </div>
    </div>
  );
}
