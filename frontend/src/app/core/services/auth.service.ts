import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  employeeLogin(empId: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/employee-login`, { empId, password })
      .pipe(tap(res => this.storeUser(res)));
  }

  passcodeLogin(role: string, passcode: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/passcode-login`, { role, passcode })
      .pipe(tap(res => this.storeUser(res)));
  }

  logout(): void {
    localStorage.removeItem('ctms_user');
    localStorage.removeItem('ctms_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    return localStorage.getItem('ctms_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.role : null;
  }

  getUserId(): number | null {
    const user = this.currentUserSubject.value;
    return user ? user.userId : null;
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  private storeUser(res: AuthResponse): void {
    localStorage.setItem('ctms_token', res.token);
    localStorage.setItem('ctms_user', JSON.stringify(res));
    this.currentUserSubject.next(res);
  }

  private getStoredUser(): AuthResponse | null {
    const stored = localStorage.getItem('ctms_user');
    return stored ? JSON.parse(stored) : null;
  }
}
