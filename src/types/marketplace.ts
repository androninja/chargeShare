export type CityId = 'bengaluru' | 'mumbai' | 'delhi-ncr' | 'pune';

export type ConnectorType = 'CCS2' | 'Type 2' | '15A Socket';

export type ChargerStatus = 'available' | 'occupied' | 'high_demand' | 'maintenance';

export type AppTab = 'discover' | 'live' | 'trips' | 'host' | 'profile';

export type VehicleCategoryFilter = 'all' | '2w' | '4w';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  phone?: string;
  homeLocality?: string;
  evVehicle?: string;
  vehicleRegNumber?: string;
  upiId?: string;
  gstin?: string;
  preferredCity: CityId;
  updatedAtIso?: string;
}

export interface UpdateProfileInput {
  displayName: string;
  phone: string;
  homeLocality: string;
  evVehicle: string;
  vehicleRegNumber: string;
  upiId: string;
  gstin: string;
  preferredCity: CityId;
}

export interface ChargerStation {
  id: string;
  name: string;
  city: CityId;
  locality: string;
  address: string;
  hostName: string;
  hostVerified: boolean;
  hostSince: string;
  hostRating: number;
  reviewCount: number;
  connectorType: ConnectorType;
  powerKw: number;
  isFastDc: boolean;
  pricePerKwh: number;
  status: ChargerStatus;
  distanceKm: number;
  /** Geographic coordinates for Google Maps */
  coordinates: {
    lat: number;
    lng: number;
  };
  amenities: string[];
  imageUrl: string;
  hostAvatarUrl?: string;
  instantBook: boolean;
  totalSessions: number;
  totalEnergyKwh: number;
  hostUid?: string;
  isPublished?: boolean;
}

export type BookingStatus =
  | 'pending_approval'
  | 'confirmed'
  | 'in_session'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  stationId: string;
  stationName: string;
  locality: string;
  city: CityId;
  hostName: string;
  hostUid?: string;
  driverUid?: string;
  driverName: string;
  vehicleModel: string;
  connectorType: ConnectorType;
  powerKw: number;
  pricePerKwh: number;
  scheduledSlot: string;
  targetKwh: number;
  estimatedTotalInr: number;
  status: BookingStatus;
  createdAt: string;
}

export interface PowerSample {
  minuteLabel: string;
  kw: number;
}

export interface LiveSession {
  userId?: string;
  bookingId: string;
  stationId: string;
  stationName: string;
  locality: string;
  hostName: string;
  vehicleModel: string;
  connectorType: ConnectorType;
  maxPowerKw: number;
  pricePerKwh: number;
  startTimeIso: string;
  elapsedSeconds: number;
  startSoc: number;
  currentSoc: number;
  targetSoc: number;
  batteryCapacityKwh: number;
  livePowerKw: number;
  energyDeliveredKwh: number;
  runningCostInr: number;
  cableLocked: boolean;
  isPaused: boolean;
  powerHistory: PowerSample[];
}

export interface Receipt {
  id: string;
  userId?: string;
  invoiceNumber: string;
  sessionDateIso: string;
  stationName: string;
  hostName: string;
  locality: string;
  vehicleModel: string;
  connectorType: ConnectorType;
  energyKwh: number;
  durationSeconds: number;
  ratePerKwh: number;
  energyChargeInr: number;
  platformFeeInr: number;
  gstInr: number;
  totalPaidInr: number;
  co2SavedKg: number;
  paymentMethod: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'emerald' | 'blue' | 'amber' | 'neutral';
}

export interface CityMapMeta {
  id: CityId;
  name: string;
  corridorLabel: string;
  center: { lat: number; lng: number };
  zoom: number;
}
