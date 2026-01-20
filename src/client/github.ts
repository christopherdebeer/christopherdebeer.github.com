declare const __GITHUB_OWNER__: string
declare const __GITHUB_REPO__: string
declare const __GITHUB_BRANCH__: string

const OWNER = __GITHUB_OWNER__
const REPO = __GITHUB_REPO__
const BRANCH = __GITHUB_BRANCH__
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
  // Properly decode base64 → UTF-8 (atob only handles Latin-1)
  const binary = atob(data.content)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const content = new TextDecoder().decode(bytes)
  return { content, sha: data.sha }
}

// Read file content using raw.githubusercontent.com (no auth required for public repos)
export async function getFileRaw(path: string): Promise<string> {
  const res = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`)
  if (!res.ok) {
    if (res.status === 404) {
      return '' // File doesn't exist yet
    }
    throw new Error(`Failed to fetch file: ${res.status}`)
  }
  return res.text()
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
  return localStorage.getItem('gh-token') || ''
}

export function storeToken(token: string): void {
  localStorage.setItem('gh-token', token)
}
