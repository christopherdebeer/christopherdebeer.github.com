const OWNER = import.meta.env.VITE_GITHUB_OWNER || 'christopherdebeer'
const REPO = import.meta.env.VITE_GITHUB_REPO || 'garden'
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'master'
const SRC_PATH = 'docs'

export interface GitHubFile {
  name: string
  path: string
}

export interface FileContent {
  content: string
  sha: string
}

async function gh<T>(endpoint: string, token: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      ...opts.headers,
    },
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function listFiles(token: string): Promise<GitHubFile[]> {
  const data = await gh<Array<{ name: string; path: string }>>(
    `/repos/${OWNER}/${REPO}/contents/${SRC_PATH}?ref=${BRANCH}`,
    token
  )
  return data.filter((f) => f.name.endsWith('.md')).map((f) => ({ name: f.name, path: f.path }))
}

export async function getFile(token: string, path: string): Promise<FileContent> {
  const data = await gh<{ content: string; sha: string }>(
    `/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    token
  )
  return { content: atob(data.content), sha: data.sha }
}

export async function saveFile(
  token: string,
  path: string,
  content: string,
  sha: string,
  message: string
): Promise<{ sha: string }> {
  const result = await gh<{ content: { sha: string } }>(`/repos/${OWNER}/${REPO}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      sha,
      branch: BRANCH,
    }),
  })
  return { sha: result.content.sha }
}

export async function createFile(
  token: string,
  path: string,
  content: string,
  message: string
): Promise<{ sha: string }> {
  const result = await gh<{ content: { sha: string } }>(`/repos/${OWNER}/${REPO}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: BRANCH,
    }),
  })
  return { sha: result.content.sha }
}

export function getStoredToken(): string {
  return sessionStorage.getItem('gh-token') || ''
}

export function storeToken(token: string): void {
  sessionStorage.setItem('gh-token', token)
}
