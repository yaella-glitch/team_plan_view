/**
 * One-click snapshot publishing to GitHub Contents API.
 *
 * Eliminates the download → move → commit → push flow. The token + repo are
 * stored in the editor's browser localStorage (not in source). Token needs
 * only the `public_repo` scope (or `repo` for private repos).
 */

const GH_TOKEN_KEY = 'team-plan-view-gh-token-v1';
const GH_REPO_KEY = 'team-plan-view-gh-repo-v1';
const SNAPSHOT_PATH = 'public/snapshot.json';

export function getGitHubToken(): string {
  try {
    return localStorage.getItem(GH_TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setGitHubToken(token: string) {
  try {
    if (token) localStorage.setItem(GH_TOKEN_KEY, token);
    else localStorage.removeItem(GH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getGitHubRepo(): string {
  try {
    return localStorage.getItem(GH_REPO_KEY) ?? 'yaella-glitch/team_plan_view';
  } catch {
    return 'yaella-glitch/team_plan_view';
  }
}

export function setGitHubRepo(repo: string) {
  try {
    if (repo) localStorage.setItem(GH_REPO_KEY, repo);
    else localStorage.removeItem(GH_REPO_KEY);
  } catch {
    // ignore
  }
}

export function isGitHubConfigured(): boolean {
  return !!getGitHubToken() && !!getGitHubRepo();
}

/** Encode a string as base64, handling Unicode safely. */
function toBase64(str: string): string {
  // The unicode-safe trick: encode → URI-decode the percent-encoded bytes → btoa.
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Publish the snapshot to GitHub. Throws on failure with a readable message.
 * Returns the commit URL so the UI can link to it.
 */
export async function publishSnapshotToGitHub(snapshot: object): Promise<string> {
  const token = getGitHubToken();
  const repo = getGitHubRepo();
  if (!token) throw new Error('No GitHub token saved. Add one in Admin → GitHub.');
  if (!repo || !repo.includes('/')) {
    throw new Error('Repo must be in the form "owner/name".');
  }

  const url = `https://api.github.com/repos/${repo}/contents/${SNAPSHOT_PATH}`;

  // 1) GET current SHA (so PUT can update, not just create).
  let sha: string | undefined;
  try {
    const getRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (getRes.ok) {
      const data = (await getRes.json()) as { sha?: string };
      sha = data.sha;
    } else if (getRes.status === 401) {
      throw new Error('GitHub: 401 Unauthorized — token is invalid or expired.');
    } else if (getRes.status === 404) {
      // Fine — file doesn't exist yet, we'll create it
      sha = undefined;
    } else if (getRes.status === 403) {
      throw new Error('GitHub: 403 Forbidden — token may lack permissions.');
    }
  } catch (err) {
    if ((err as Error).message?.startsWith('GitHub:')) throw err;
    // network error
  }

  const json = JSON.stringify(snapshot, null, 2);
  const content = toBase64(json);

  // 2) PUT new content
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Publish snapshot ${new Date().toISOString().slice(0, 19)}`,
      content,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => '');
    throw new Error(`GitHub publish failed (${putRes.status}): ${text || putRes.statusText}`);
  }

  const result = (await putRes.json()) as { commit?: { html_url?: string } };
  return result.commit?.html_url ?? '';
}
