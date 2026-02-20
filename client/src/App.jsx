import { useState, useEffect, useCallback } from 'react';
import { fetchBulletinData, fetchCommitInfo } from './api';
import { CATEGORY_CONFIG } from './config';
import { formatLastUpdated, getCardLabels } from './utils';
import CategoryTabs from './components/CategoryTabs';
import BulletinSection from './components/BulletinSection';
import InfoSection from './components/InfoSection';
import CommitInfo from './components/CommitInfo';

export default function App() {
  const [data, setData] = useState(null);
  const [commit, setCommit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('eb3');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bulletin = await fetchBulletinData();
      setData(bulletin);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchCommitInfo()
      .then(setCommit)
      .catch((err) => console.error('Error loading commit info:', err));
  }, [loadData]);

  if (loading) {
    return (
      <div className="container">
        <Header />
        <div className="loading">
          <div className="spinner" />
          <p>Fetching latest visa bulletin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Header />
        <div className="error">
          <p>Failed to fetch visa bulletin data. Please try again later.</p>
          <p className="error-details">{error}</p>
        </div>
        <RefreshButton onClick={loadData} />
      </div>
    );
  }

  const config = CATEGORY_CONFIG[activeCategory];
  const { current, upcoming, comparisonMode } = data;
  const labels = getCardLabels(comparisonMode);

  return (
    <div className="container">
      <Header />
      <CategoryTabs activeCategory={activeCategory} onSwitch={setActiveCategory} />

      <BulletinSection
        title="Dates for Filing"
        icon="📋"
        subtitle={`Priority date cutoffs for filing ${config.label} India visa applications`}
        earlier={current}
        later={upcoming}
        dateKey={config.filingDateKey}
        movement={data[config.movementKey]}
        labels={labels}
        isFinalAction={false}
      />

      <div className="section-divider" />

      <BulletinSection
        title="Final Action Date"
        icon="⚖️"
        subtitle={`Date when USCIS makes a final determination on ${config.label} India visa applications`}
        earlier={current}
        later={upcoming}
        dateKey={config.finalActionDateKey}
        movement={data[config.faMovementKey]}
        labels={labels}
        isFinalAction={true}
      />

      <InfoSection />
      <div className="last-updated">
        Last updated: <span>{formatLastUpdated(data.lastUpdated)}</span>
      </div>
      <RefreshButton onClick={loadData} />
      <CommitInfo commit={commit} />
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1>India Visa Bulletin Tracker</h1>
      <p className="subtitle">Filing Dates &amp; Final Action Dates for Employment-Based Categories</p>
    </header>
  );
}

function RefreshButton({ onClick }) {
  return (
    <button className="refresh-btn" onClick={onClick}>
      <span className="refresh-icon">↻</span> Refresh Data
    </button>
  );
}
