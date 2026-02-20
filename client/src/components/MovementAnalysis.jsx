export default function MovementAnalysis({ movement, earlierDate, laterDate, isFinalAction }) {
  const label = isFinalAction ? 'final action date' : 'priority date';

  const directionMap = {
    forward: {
      arrow: '↑',
      text: 'Moved Forward',
      cssClass: 'movement-forward',
      details: (
        <>
          <strong>Great news!</strong> The {label} has moved forward by{' '}
          <strong>{movement.days} days</strong>.<br />
          From <strong>{earlierDate}</strong> to <strong>{laterDate}</strong>
        </>
      ),
    },
    backward: {
      arrow: '↓',
      text: 'Moved Backward',
      cssClass: 'movement-backward',
      details: (
        <>
          The {label} has moved backward by <strong>{Math.abs(movement.days)} days</strong>.<br />
          From <strong>{earlierDate}</strong> to <strong>{laterDate}</strong>
        </>
      ),
    },
    'no change': {
      arrow: '→',
      text: 'No Movement',
      cssClass: 'movement-none',
      details: (
        <>
          The {label} remains at <strong>{earlierDate}</strong> with no change.
        </>
      ),
    },
  };

  const info = directionMap[movement.direction] || directionMap['no change'];

  return (
    <div className="card movement-card">
      <div className="card-header">
        <h2>Movement Analysis</h2>
      </div>
      <div className="card-body">
        <div className={`movement-indicator ${info.cssClass}`}>
          <span className="movement-arrow">{info.arrow}</span>
          <span className="movement-text">{info.text}</span>
        </div>
        <div className="movement-details">{info.details}</div>
      </div>
    </div>
  );
}
