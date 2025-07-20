const STORAGE_KEY = 'github_token';

export class AuthService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(STORAGE_KEY);
    }
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      this.token = token;
      localStorage.setItem(STORAGE_KEY, token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  hasToken(): boolean {
    return this.token !== null && this.token.trim() !== '';
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      this.token = null;
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async validateToken(): Promise<boolean> {
    if (!this.hasToken()) return false;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
}

export const authService = new AuthService();