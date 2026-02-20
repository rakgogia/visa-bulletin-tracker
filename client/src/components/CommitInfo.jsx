import { formatRelativeTime } from '../utils';

export default function CommitInfo({ commit }) {
  if (!commit) return null;

  return (
    <div className="commit-info">
      <div className="commit-icon">⚡</div>
      <div className="commit-details">
        <div className="commit-header">Latest Deployment</div>
        <div className="commit-message">{commit.message}</div>
        <div className="commit-meta">
          <span className="commit-sha">{commit.sha}</span>
          <span className="commit-separator">·</span>
          <span className="commit-author">{commit.author}</span>
          <span className="commit-separator">·</span>
          <span className="commit-date">{formatRelativeTime(new Date(commit.date))}</span>
        </div>
      </div>
      <a href={commit.url} target="_blank" rel="noopener noreferrer" className="commit-link-btn" title="View on GitHub">
        ↗
      </a>
    </div>
  );
}
