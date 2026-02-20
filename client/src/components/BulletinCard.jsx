export default function BulletinCard({ bulletin, dateKey, label, badgeClass, isFinalAction }) {
  const date = bulletin?.[dateKey] ?? '-';
  const month = bulletin?.month ?? '-';
  const url = bulletin?.url;

  return (
    <div className="card">
      <div className="card-header">
        <h2>{label} Bulletin</h2>
        <span className={badgeClass}>{label}</span>
      </div>
      <div className="card-body">
        <div className="month-label">{month}</div>
        <div className={`date-display${isFinalAction ? ' date-display-fa' : ''}`}>{date}</div>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="bulletin-link">
            View Official Bulletin →
          </a>
        )}
      </div>
    </div>
  );
}
