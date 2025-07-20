import { authService } from './auth';

export interface GitHubFileResponse {
  content: string;
  sha: string;
  path: string;
}

export class GitHubService {
  private readonly owner = 'christopherdebeer';
  private readonly repo = 'christopherdebeer.github.com';
  private readonly baseUrl = 'https://api.github.com';

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No GitHub token available');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${error}`);
    }

    return response;
  }

  async getFile(path: string): Promise<GitHubFileResponse> {
    const response = await this.makeRequest(`/repos/${this.owner}/${this.repo}/contents/${path}`);
    const data = await response.json();
    
    if (data.type !== 'file') {
      throw new Error('Path does not point to a file');
    }

    const content = atob(data.content);
    return {
      content,
      sha: data.sha,
      path: data.path,
    };
  }

  async updateFile(path: string, content: string, sha: string, message: string): Promise<void> {
    // Properly encode UTF-8 content to base64
    const encodedContent = btoa(new TextEncoder().encode(content).reduce((data, byte) => {
      return data + String.fromCharCode(byte);
    }, ''));
    
    const body = {
      message: message,
      content: encodedContent,
      sha: sha,
    };

    await this.makeRequest(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  getBlogFilePath(slug: string): string {
    return `src/content/blog/${slug}.md`;
  }

  getProjectFilePath(slug: string): string {
    return `projects/${slug}.md`;
  }
}

export const githubService = new GitHubService();