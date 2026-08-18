import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TripRequest, TripMilestone, MilestoneUpdate,
  Itinerary, Expense, UserProfile, ApprovalRequest, TripClosureCheck
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class TripService {

  private apiUrl = environment.apiUrl;

  // Reactive state for active trips
  private tripsSubject = new BehaviorSubject<TripRequest[]>([]);
  public trips$ = this.tripsSubject.asObservable();

  private activeTripSubject = new BehaviorSubject<TripRequest | null>(null);
  public activeTrip$ = this.activeTripSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== Trip Requests ====================

  createTrip(trip: Partial<TripRequest>): Observable<TripRequest> {
    return this.http.post<TripRequest>(`${this.apiUrl}/trips`, trip);
  }

  getMyTrips(): Observable<TripRequest[]> {
    return this.http.get<TripRequest[]>(`${this.apiUrl}/trips/my-trips`)
      .pipe(tap(trips => this.tripsSubject.next(trips)));
  }

  getTripById(id: number): Observable<TripRequest> {
    return this.http.get<TripRequest>(`${this.apiUrl}/trips/${id}`);
  }

  getPendingRequests(): Observable<TripRequest[]> {
    return this.http.get<TripRequest[]>(`${this.apiUrl}/trips/pending`);
  }

  getApprovedRequests(): Observable<TripRequest[]> {
    return this.http.get<TripRequest[]>(`${this.apiUrl}/trips/approved`);
  }

  getActiveTrips(): Observable<TripRequest[]> {
    return this.http.get<TripRequest[]>(`${this.apiUrl}/trips/active`);
  }

  approveTrip(id: number, approval: ApprovalRequest): Observable<TripRequest> {
    return this.http.put<TripRequest>(`${this.apiUrl}/trips/${id}/approve`, approval);
  }

  rejectTrip(id: number, reason: string): Observable<TripRequest> {
    return this.http.put<TripRequest>(`${this.apiUrl}/trips/${id}/reject`, { reason });
  }

  // ==================== Milestones ====================

  updateMilestone(tripId: number, update: MilestoneUpdate): Observable<TripMilestone> {
    return this.http.patch<TripMilestone>(`${this.apiUrl}/trips/${tripId}/milestone`, update);
  }

  getMilestones(tripId: number): Observable<TripMilestone> {
    return this.http.get<TripMilestone>(`${this.apiUrl}/trips/${tripId}/milestones`);
  }

  // ==================== Itinerary ====================

  createItinerary(tripId: number, itinerary: Itinerary): Observable<Itinerary> {
    return this.http.post<Itinerary>(`${this.apiUrl}/itinerary/${tripId}`, itinerary);
  }

  getItinerary(tripId: number): Observable<Itinerary> {
    return this.http.get<Itinerary>(`${this.apiUrl}/itinerary/${tripId}`);
  }

  activateTrip(tripId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/itinerary/${tripId}/activate`, {});
  }

  markAssetsReturned(tripId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/itinerary/${tripId}/assets-returned`, {});
  }

  // ==================== Trip Closure ====================

  checkTripClosure(tripId: number): Observable<TripClosureCheck> {
    return this.http.get<TripClosureCheck>(`${this.apiUrl}/trips/${tripId}/closure-check`);
  }

  closeTrip(tripId: number, force: boolean = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/trips/${tripId}/close?force=${force}`, {});
  }

  // ==================== Expenses ====================

  uploadExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/expenses`, expense);
  }

  getExpensesByTrip(tripId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses/trip/${tripId}`);
  }

  getPendingExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses/pending`);
  }

  creditExpense(id: number): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/expenses/${id}/credit`, {});
  }

  // ==================== User ====================

  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/users/me`);
  }

  // ==================== Admin ====================

  getAllUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/users`);
  }

  getAllTrips(): Observable<TripRequest[]> {
    return this.http.get<TripRequest[]>(`${this.apiUrl}/trips/all`);
  }

  // ==================== State helpers ====================

  setActiveTrip(trip: TripRequest): void {
    this.activeTripSubject.next(trip);
  }

  filterTripsByStatus(status: string): TripRequest[] {
    return this.tripsSubject.value.filter(t => t.status === status);
  }
}
