export interface AuthResponse {
  token: string;
  userId: number;
  empId: string;
  name: string;
  role: string;
}

export interface TripRequest {
  id?: number;
  projectNo: string;
  clientId: string;
  destination: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  needsFlight: boolean;
  needsHotel: boolean;
  needsCab: boolean;
  extraLuggageKg?: number;
  status?: string;
  employeeName?: string;
  employeeEmpId?: string;
  remarks?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  itinerary?: Itinerary;
  milestones?: TripMilestone;
}

export interface TripMilestone {
  tripId: number;
  flightBoarded: boolean;
  flightLanded: boolean;
  cabPickedUp: boolean;
  hotelCheckedIn: boolean;
  hotelCheckedOut: boolean;
  returnFlightBoarded: boolean;
  journeyEnded: boolean;
  // Verification texts
  flightBoardedVerification?: string;
  flightLandedVerification?: string;
  cabPickedUpVerification?: string;
  hotelCheckedInVerification?: string;
  hotelCheckedOutVerification?: string;
  returnFlightBoardedVerification?: string;
  journeyEndedVerification?: string;
  // Actual completion timestamps
  flightBoardedAt?: string;
  flightLandedAt?: string;
  cabPickedUpAt?: string;
  hotelCheckedInAt?: string;
  hotelCheckedOutAt?: string;
  returnFlightBoardedAt?: string;
  journeyEndedAt?: string;
  // Scheduled timeline
  scheduledTimeline?: ChecklistTimeline;
  updatedAt?: string;
}

export interface ChecklistTimeline {
  tripId: number;
  flightBoardingTime?: string;
  flightLandingTime?: string;
  cabPickupTime?: string;
  hotelCheckinTime?: string;
  hotelCheckoutTime?: string;
  returnFlightTime?: string;
  journeyEndTime?: string;
}

export interface Itinerary {
  tripId: number;
  pnr?: string;
  flightDetails?: string;
  cabDriverName?: string;
  cabNumber?: string;
  cabDetails?: string;
  hotelName?: string;
  hotelAddress?: string;
  hotelDetails?: string;
  allocatedAssets?: string;
  assetsReturned?: boolean;
}

export interface Expense {
  id?: number;
  tripId: number;
  fileUrl?: string;
  fileName?: string;
  amount: number;
  description?: string;
  status?: string;
  createdAt?: string;
  creditedAt?: string;
}

export interface UserProfile {
  id: number;
  empId: string;
  name: string;
  role: string;
  isActive: boolean;
  profilePicUrl?: string;
  dateOfJoining?: string;
  contact?: string;
  passportNumber?: string;
  govtId?: string;
  department?: string;
  designation?: string;
  activeTripsCount: number;
  totalTrips: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  message: string;
  details: string;
}

export interface MilestoneUpdate {
  milestoneName: string;
  value: boolean;
  verificationText: string;
}

export interface ApprovalRequest {
  remarks: string;
  allocatedAssets?: string;
}

export interface TripClosureCheck {
  tripId: number;
  datePassed: boolean;
  endDate: string;
  expensesCredited: boolean;
  pendingExpensesCount: number;
  assetsReturned: boolean;
  allocatedAssets: string;
  journeyEnded: boolean;
  canClose: boolean;
  closureBlockReason: string;
}
