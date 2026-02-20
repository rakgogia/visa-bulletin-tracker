const API_URL = '/api/visa-bulletin';
const COMMIT_URL = '/api/commit-info';

export async function fetchBulletinData() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

export async function fetchCommitInfo() {
  const response = await fetch(COMMIT_URL);
  if (!response.ok) throw new Error('Failed to fetch commit info');
  return response.json();
}
