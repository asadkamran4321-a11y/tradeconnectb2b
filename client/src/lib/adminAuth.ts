export interface AdminUser {
  id: number;
  email: string;
  role: 'admin';
  approved: boolean;
}

export class AdminAuthService {
  private static instance: AdminAuthService;
  private currentUser: AdminUser | null = null;

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  constructor() {
    // Try to restore user from localStorage
    this.restoreUser();
  }

  private restoreUser(): void {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role === 'admin') {
          this.currentUser = user;
        }
      }
    } catch (error) {
      console.error('Error restoring user:', error);
    }
  }

  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  setCurrentUser(user: AdminUser): void {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentUser.role === 'admin';
  }

  isSuperAdmin(): boolean {
    // Super admin is the primary admin with ID 999
    return this.isAuthenticated() && this.currentUser?.id === 999;
  }

  getUserId(): number | null {
    return this.currentUser?.id || null;
  }

  getAuthHeaders(): { [key: string]: string } {
    const userId = this.getUserId();
    return userId ? { 'user-id': userId.toString() } : {};
  }
}

export const adminAuthService = AdminAuthService.getInstance();