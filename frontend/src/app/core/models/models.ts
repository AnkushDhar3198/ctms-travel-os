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
  updatedAt?: string;
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
}

export interface ApprovalRequest {
  remarks: string;
  allocatedAssets?: string;
}
