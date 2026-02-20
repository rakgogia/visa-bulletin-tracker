import BulletinCard from './BulletinCard';
import MovementAnalysis from './MovementAnalysis';

export default function BulletinSection({
  title,
  icon,
  subtitle,
  earlier,
  later,
  dateKey,
  movement,
  labels,
  isFinalAction,
}) {
  return (
    <>
      <div className="section-header">
        <h2 className="section-title">
          {icon} {title}
        </h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>
      <div className="bulletin-cards">
        <BulletinCard
          bulletin={earlier}
          dateKey={dateKey}
          label={labels.first.label}
          badgeClass={labels.first.badgeClass}
          isFinalAction={isFinalAction}
        />
        <BulletinCard
          bulletin={later}
          dateKey={dateKey}
          label={labels.second.label}
          badgeClass={labels.second.badgeClass}
          isFinalAction={isFinalAction}
        />
        <MovementAnalysis
          movement={movement}
          earlierDate={earlier?.[dateKey] ?? '-'}
          laterDate={later?.[dateKey] ?? '-'}
          isFinalAction={isFinalAction}
        />
      </div>
    </>
  );
}
