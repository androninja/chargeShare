import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isFirestoreQuotaError,
} from '../firebase';
import {
  CITY_MAP_META,
  EV_VEHICLE_PRESETS,
  INITIAL_CHARGERS,
  STATION_IMAGES,
} from '../data/seedData';
import {
  AppTab,
  Booking,
  ChargerStation,
  ChargerStatus,
  CityId,
  ConnectorType,
  LiveSession,
  Receipt,
  ToastMessage,
  UpdateProfileInput,
  UserProfile,
} from '../types/marketplace';

export interface NewChargerInput {
  name: string;
  city: CityId;
  locality: string;
  address: string;
  hostName: string;
  connectorType: ConnectorType;
  powerKw: number;
  pricePerKwh: number;
  amenities: string[];
  instantBook: boolean;
}

export interface CreateBookingInput {
  stationId: string;
  vehicleModel: string;
  scheduledSlot: string;
  targetKwh: number;
}

interface MarketplaceContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  authReady: boolean;
  authBusy: boolean;
  isAdmin: boolean;
  firestoreQuotaExceeded: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (input: UpdateProfileInput) => Promise<boolean>;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  city: CityId;
  setCity: (city: CityId) => void;
  chargers: ChargerStation[];
  chargersLoading: boolean;
  bookings: Booking[];
  receipts: Receipt[];
  activeSession: LiveSession | null;
  selectedStationId: string | null;
  setSelectedStationId: (id: string | null) => void;
  drawerStationId: string | null;
  openBookingDrawer: (stationId: string) => void;
  closeBookingDrawer: () => void;
  isAddChargerOpen: boolean;
  setAddChargerOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  createBooking: (input: CreateBookingInput) => Promise<Booking | null>;
  cancelBooking: (bookingId: string) => Promise<void>;
  startChargingFromBooking: (bookingId: string) => Promise<void>;
  startQuickDemoSession: () => Promise<void>;
  toggleCableLock: () => void;
  toggleSessionPause: () => void;
  updateTargetSoc: (soc: number) => void;
  stopAndPaySession: (paymentMethod: string) => Promise<Receipt | null>;
  toggleChargerStatus: (stationId: string, status: ChargerStatus) => Promise<void>;
  updateChargerPrice: (stationId: string, newPrice: number) => Promise<void>;
  approveBooking: (bookingId: string) => Promise<void>;
  declineBooking: (bookingId: string) => Promise<void>;
  addNewCharger: (input: NewChargerInput) => Promise<ChargerStation | null>;
  resetDemoData: () => Promise<void>;
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export function calculateBilling(targetKwh: number, pricePerKwh: number) {
  const energyChargeInr = Number((targetKwh * pricePerKwh).toFixed(2));
  const platformFeeInr = 15.0;
  const gstInr = Number((platformFeeInr * 0.18).toFixed(2));
  const totalInr = Number((energyChargeInr + platformFeeInr + gstInr).toFixed(2));
  return { energyChargeInr, platformFeeInr, gstInr, totalInr };
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
}

function clampString(raw: string, maxLen: number, fallback = ''): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

function buildChargerPayload(station: ChargerStation, hostUid: string) {
  const payload: Record<string, unknown> = {
    id: sanitizeId(station.id),
    name: clampString(station.name, 120, 'EV Charging Bay'),
    city: station.city,
    locality: clampString(station.locality, 120, 'City Center'),
    address: clampString(station.address, 260, station.locality),
    hostName: clampString(station.hostName, 100, 'Community Host'),
    hostUid,
    hostVerified: Boolean(station.hostVerified),
    hostSince: clampString(station.hostSince || '2026', 10, '2026'),
    hostRating: Number(Math.max(0, Math.min(5, station.hostRating)).toFixed(2)),
    reviewCount: Math.max(0, Math.round(station.reviewCount)),
    connectorType: station.connectorType,
    powerKw: Number(Math.max(1, Math.min(350, station.powerKw)).toFixed(1)),
    isFastDc: Boolean(station.isFastDc),
    pricePerKwh: Number(Math.max(5, Math.min(60, station.pricePerKwh)).toFixed(2)),
    status: station.status,
    distanceKm: Number(Math.max(0, Math.min(500, station.distanceKm)).toFixed(1)),
    coordinates: {
      lat: Number(station.coordinates.lat),
      lng: Number(station.coordinates.lng),
    },
    amenities: (station.amenities || [])
      .map((a) => clampString(a, 60))
      .filter(Boolean)
      .slice(0, 12),
    imageUrl: clampString(station.imageUrl, 500, STATION_IMAGES.driveway),
    instantBook: Boolean(station.instantBook),
    totalSessions: Math.max(0, Math.round(station.totalSessions)),
    totalEnergyKwh: Number(Math.max(0, station.totalEnergyKwh).toFixed(1)),
    isPublished: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (station.hostAvatarUrl && station.hostAvatarUrl.length <= 500) {
    payload.hostAvatarUrl = station.hostAvatarUrl;
  }
  return payload;
}

function buildLiveSessionPayload(session: LiveSession, userId: string) {
  return {
    userId,
    bookingId: sanitizeId(session.bookingId),
    stationId: sanitizeId(session.stationId),
    stationName: clampString(session.stationName, 120, 'EV Charging Bay'),
    locality: clampString(session.locality, 120, 'City Center'),
    hostName: clampString(session.hostName, 100, 'Host'),
    vehicleModel: clampString(session.vehicleModel, 100, 'EV'),
    connectorType: session.connectorType,
    maxPowerKw: Number(Math.max(1, Math.min(350, session.maxPowerKw)).toFixed(2)),
    pricePerKwh: Number(Math.max(5, Math.min(60, session.pricePerKwh)).toFixed(2)),
    startTimeIso: clampString(session.startTimeIso, 40, new Date().toISOString()),
    elapsedSeconds: Math.max(0, Math.round(session.elapsedSeconds)),
    startSoc: Number(Math.max(0, Math.min(100, session.startSoc)).toFixed(1)),
    currentSoc: Number(Math.max(0, Math.min(100, session.currentSoc)).toFixed(1)),
    targetSoc: Number(Math.max(10, Math.min(100, session.targetSoc)).toFixed(1)),
    batteryCapacityKwh: Number(Math.max(1, Math.min(300, session.batteryCapacityKwh)).toFixed(1)),
    livePowerKw: Number(Math.max(0, Math.min(350, session.livePowerKw)).toFixed(2)),
    energyDeliveredKwh: Number(Math.max(0, Math.min(500, session.energyDeliveredKwh)).toFixed(3)),
    runningCostInr: Number(Math.max(0, Math.min(100000, session.runningCostInr)).toFixed(2)),
    cableLocked: Boolean(session.cableLocked),
    isPaused: Boolean(session.isPaused),
    powerHistory: (session.powerHistory || []).slice(-24).map((p) => ({
      minuteLabel: clampString(p.minuteLabel, 16, '0m'),
      kw: Number(Math.max(0, Math.min(500, p.kw)).toFixed(2)),
    })),
    updatedAt: serverTimestamp(),
  };
}

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState(false);

  const [city, setCityState] = useState<CityId>('bengaluru');
  const [firestoreChargers, setFirestoreChargers] = useState<ChargerStation[] | null>(null);
  const [chargersLoading, setChargersLoading] = useState(true);

  const [driverBookings, setDriverBookings] = useState<Booking[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('discover');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    INITIAL_CHARGERS[0]?.id ?? null,
  );
  const [drawerStationId, setDrawerStationId] = useState<string | null>(null);
  const [isAddChargerOpen, setAddChargerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const seededIdsRef = useRef<Record<string, boolean>>({});
  const lastTelemetrySyncAtRef = useRef(0);
  const activeSessionRef = useRef<LiveSession | null>(null);
  activeSessionRef.current = activeSession;

  const isAdmin = useMemo(
    () =>
      Boolean(
        user &&
          user.emailVerified &&
          user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase(),
      ),
    [user],
  );

  // Use live Firestore chargers once populated; show preloaded Indian EV stations while empty
  const chargers = useMemo(() => {
    if (firestoreChargers && firestoreChargers.length > 0) {
      return firestoreChargers;
    }
    return INITIAL_CHARGERS;
  }, [firestoreChargers]);

  // Merge driver & host bookings cleanly without duplicates
  const bookings = useMemo(() => {
    const byId: Record<string, Booking> = {};
    for (const b of driverBookings) byId[b.id] = b;
    for (const b of hostBookings) byId[b.id] = b;
    return Object.values(byId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [driverBookings, hostBookings]);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleDbError = useCallback(
    (err: unknown, op: OperationType, path: string | null) => {
      if (isFirestoreQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
        pushToast({
          title: 'Daily Database Quota Reached',
          description: 'Free-tier Firestore quota resets tomorrow or can be upgraded in Firebase.',
          tone: 'amber',
        });
      }
      handleFirestoreError(err, op, path);
    },
    [pushToast],
  );

  // 1. Firebase Auth state listener + user profile sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setUserProfile(null);
        setDriverBookings([]);
        setHostBookings([]);
        setReceipts([]);
        setActiveSession(null);
        return;
      }

      if (nextUser.emailVerified && nextUser.email) {
        const profilePath = `users/${nextUser.uid}/private/profile`;
        try {
          const profileRef = doc(db, 'users', nextUser.uid, 'private', 'profile');
          const snap = await getDoc(profileRef);
          const existing = snap.exists() ? snap.data() : null;
          const existingCity = existing?.preferredCity as CityId | undefined;
          const preferredCity: CityId =
            existingCity && CITY_MAP_META[existingCity] ? existingCity : 'bengaluru';
          if (existingCity && CITY_MAP_META[existingCity]) {
            setCityState(existingCity);
          }

          if (!snap.exists()) {
            const profilePayload: Record<string, unknown> = {
              uid: nextUser.uid,
              displayName: clampString(
                nextUser.displayName || nextUser.email.split('@')[0] || 'EV Driver',
                100,
                'EV Driver',
              ),
              email: clampString(nextUser.email, 160),
              preferredCity,
              updatedAt: serverTimestamp(),
            };
            if (nextUser.photoURL && nextUser.photoURL.length <= 500) {
              profilePayload.photoUrl = nextUser.photoURL;
            }
            await setDoc(profileRef, profilePayload);
          } else if (
            nextUser.photoURL &&
            nextUser.photoURL.length <= 500 &&
            existing?.photoUrl !== nextUser.photoURL
          ) {
            await updateDoc(profileRef, {
              photoUrl: nextUser.photoURL,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleDbError(err, OperationType.WRITE, profilePath);
        }
      }
    });
    return () => unsub();
  }, [handleDbError]);

  // 2. Public live Firestore subscription for published chargers
  useEffect(() => {
    const path = 'chargers';
    const chargersQuery = query(collection(db, path), where('isPublished', '==', true));
    const unsub = onSnapshot(
      chargersQuery,
      (snapshot) => {
        const items: ChargerStation[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            name: String(data.name ?? ''),
            city: (data.city as CityId) ?? 'bengaluru',
            locality: String(data.locality ?? ''),
            address: String(data.address ?? ''),
            hostName: String(data.hostName ?? ''),
            hostUid: data.hostUid ? String(data.hostUid) : undefined,
            hostVerified: Boolean(data.hostVerified),
            hostSince: String(data.hostSince ?? '2025'),
            hostRating: Number(data.hostRating ?? 4.8),
            reviewCount: Number(data.reviewCount ?? 0),
            connectorType: (data.connectorType as ConnectorType) ?? 'Type 2',
            powerKw: Number(data.powerKw ?? 7.4),
            isFastDc: Boolean(data.isFastDc),
            pricePerKwh: Number(data.pricePerKwh ?? 16.5),
            status: (data.status as ChargerStatus) ?? 'available',
            distanceKm: Number(data.distanceKm ?? 1.5),
            coordinates: {
              lat: Number(data.coordinates?.lat ?? 12.956),
              lng: Number(data.coordinates?.lng ?? 77.645),
            },
            amenities: Array.isArray(data.amenities) ? data.amenities.map(String) : [],
            imageUrl: String(data.imageUrl ?? STATION_IMAGES.driveway),
            hostAvatarUrl: data.hostAvatarUrl ? String(data.hostAvatarUrl) : undefined,
            instantBook: Boolean(data.instantBook),
            totalSessions: Number(data.totalSessions ?? 0),
            totalEnergyKwh: Number(data.totalEnergyKwh ?? 0),
            isPublished: Boolean(data.isPublished ?? true),
          };
        });
        setFirestoreChargers(items);
        setChargersLoading(false);
      },
      (err) => {
        setChargersLoading(false);
        handleDbError(err, OperationType.LIST, path);
      },
    );
    return () => unsub();
  }, [handleDbError]);

  // 3. Auto-seed any missing initial Indian EV station catalog entries into Firestore when a verified user signs in
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || chargersLoading) return;
    if (firestoreChargers === null) return;

    const existingIds = new Set(firestoreChargers.map((c) => c.id));
    const missingStations = INITIAL_CHARGERS.filter(
      (st) => !existingIds.has(st.id) && !seededIdsRef.current[st.id],
    );
    if (missingStations.length === 0) return;

    for (const st of missingStations) {
      seededIdsRef.current[st.id] = true;
    }

    const seedCatalog = async () => {
      const batch = writeBatch(db);
      for (const st of missingStations) {
        const ref = doc(db, 'chargers', st.id);
        batch.set(ref, buildChargerPayload(st, user.uid));
      }
      try {
        await batch.commit();
      } catch (err) {
        for (const st of missingStations) {
          seededIdsRef.current[st.id] = false;
        }
        handleDbError(err, OperationType.WRITE, 'chargers');
      }
    };
    void seedCatalog();
  }, [authReady, user, chargersLoading, firestoreChargers, handleDbError]);

  // 4. User-scoped Firestore listeners (only attached when authenticated & ready)
  useEffect(() => {
    if (!authReady || !user) return;

    const mapBooking = (docSnap: { id: string; data: () => Record<string, unknown> }): Booking => {
      const data = docSnap.data();
      const createdRaw = data.createdAt as { toDate?: () => Date } | string | undefined;
      const createdIso =
        createdRaw && typeof createdRaw === 'object' && typeof createdRaw.toDate === 'function'
          ? createdRaw.toDate().toISOString()
          : typeof createdRaw === 'string'
            ? createdRaw
            : new Date().toISOString();
      return {
        id: String(data.id ?? docSnap.id),
        stationId: String(data.stationId ?? ''),
        stationName: String(data.stationName ?? ''),
        locality: String(data.locality ?? ''),
        city: (data.city as CityId) ?? 'bengaluru',
        hostName: String(data.hostName ?? ''),
        hostUid: data.hostUid ? String(data.hostUid) : undefined,
        driverUid: data.driverUid ? String(data.driverUid) : undefined,
        driverName: String(data.driverName ?? 'EV Driver'),
        vehicleModel: String(data.vehicleModel ?? ''),
        connectorType: (data.connectorType as ConnectorType) ?? 'Type 2',
        powerKw: Number(data.powerKw ?? 7.4),
        pricePerKwh: Number(data.pricePerKwh ?? 16.5),
        scheduledSlot: String(data.scheduledSlot ?? ''),
        targetKwh: Number(data.targetKwh ?? 15),
        estimatedTotalInr: Number(data.estimatedTotalInr ?? 0),
        status: (data.status as Booking['status']) ?? 'confirmed',
        createdAt: createdIso,
      };
    };

    const driverBookingsQuery = query(collection(db, 'bookings'), where('driverUid', '==', user.uid));
    const unsubDriverBookings = onSnapshot(
      driverBookingsQuery,
      (snap) => {
        setDriverBookings(snap.docs.map(mapBooking));
      },
      (err) => handleDbError(err, OperationType.LIST, 'bookings'),
    );

    const hostBookingsQuery = query(collection(db, 'bookings'), where('hostUid', '==', user.uid));
    const unsubHostBookings = onSnapshot(
      hostBookingsQuery,
      (snap) => {
        setHostBookings(snap.docs.map(mapBooking));
      },
      (err) => handleDbError(err, OperationType.LIST, 'bookings'),
    );

    const receiptsPath = `users/${user.uid}/receipts`;
    const unsubReceipts = onSnapshot(
      collection(db, 'users', user.uid, 'receipts'),
      (snap) => {
        const list: Receipt[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: String(data.id ?? d.id),
              userId: data.userId ? String(data.userId) : user.uid,
              invoiceNumber: String(data.invoiceNumber ?? ''),
              sessionDateIso: String(data.sessionDateIso ?? new Date().toISOString()),
              stationName: String(data.stationName ?? ''),
              hostName: String(data.hostName ?? ''),
              locality: String(data.locality ?? ''),
              vehicleModel: String(data.vehicleModel ?? ''),
              connectorType: (data.connectorType as ConnectorType) ?? 'Type 2',
              energyKwh: Number(data.energyKwh ?? 0),
              durationSeconds: Number(data.durationSeconds ?? 0),
              ratePerKwh: Number(data.ratePerKwh ?? 0),
              energyChargeInr: Number(data.energyChargeInr ?? 0),
              platformFeeInr: Number(data.platformFeeInr ?? 15),
              gstInr: Number(data.gstInr ?? 2.7),
              totalPaidInr: Number(data.totalPaidInr ?? 0),
              co2SavedKg: Number(data.co2SavedKg ?? 0),
              paymentMethod: String(data.paymentMethod ?? 'UPI'),
            };
          })
          .sort(
            (a, b) =>
              new Date(b.sessionDateIso).getTime() - new Date(a.sessionDateIso).getTime(),
          );
        setReceipts(list);
      },
      (err) => handleDbError(err, OperationType.LIST, receiptsPath),
    );

    const sessionPath = `users/${user.uid}/activeSession/current`;
    const unsubSession = onSnapshot(
      doc(db, 'users', user.uid, 'activeSession', 'current'),
      (snap) => {
        if (!snap.exists()) {
          setActiveSession(null);
          return;
        }
        const data = snap.data();
        setActiveSession({
          userId: String(data.userId ?? user.uid),
          bookingId: String(data.bookingId ?? ''),
          stationId: String(data.stationId ?? ''),
          stationName: String(data.stationName ?? ''),
          locality: String(data.locality ?? ''),
          hostName: String(data.hostName ?? ''),
          vehicleModel: String(data.vehicleModel ?? ''),
          connectorType: (data.connectorType as ConnectorType) ?? 'Type 2',
          maxPowerKw: Number(data.maxPowerKw ?? 7.4),
          pricePerKwh: Number(data.pricePerKwh ?? 16.5),
          startTimeIso: String(data.startTimeIso ?? new Date().toISOString()),
          elapsedSeconds: Number(data.elapsedSeconds ?? 0),
          startSoc: Number(data.startSoc ?? 35),
          currentSoc: Number(data.currentSoc ?? 35),
          targetSoc: Number(data.targetSoc ?? 85),
          batteryCapacityKwh: Number(data.batteryCapacityKwh ?? 40.5),
          livePowerKw: Number(data.livePowerKw ?? 0),
          energyDeliveredKwh: Number(data.energyDeliveredKwh ?? 0),
          runningCostInr: Number(data.runningCostInr ?? 0),
          cableLocked: Boolean(data.cableLocked ?? true),
          isPaused: Boolean(data.isPaused ?? false),
          powerHistory: Array.isArray(data.powerHistory)
            ? data.powerHistory.map((p: { minuteLabel?: unknown; kw?: unknown }) => ({
                minuteLabel: String(p.minuteLabel ?? '0m'),
                kw: Number(p.kw ?? 0),
              }))
            : [],
        });
      },
      (err) => handleDbError(err, OperationType.GET, sessionPath),
    );

    const profilePath = `users/${user.uid}/private/profile`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid, 'private', 'profile'),
      (snap) => {
        if (!snap.exists()) {
          setUserProfile(null);
          return;
        }
        const data = snap.data();
        const updatedRaw = data.updatedAt as { toDate?: () => Date } | undefined;
        const updatedAtIso =
          updatedRaw && typeof updatedRaw === 'object' && typeof updatedRaw.toDate === 'function'
            ? updatedRaw.toDate().toISOString()
            : undefined;
        setUserProfile({
          uid: String(data.uid ?? user.uid),
          displayName: String(data.displayName ?? user.displayName ?? 'EV Driver'),
          email: String(data.email ?? user.email ?? ''),
          photoUrl: data.photoUrl ? String(data.photoUrl) : undefined,
          phone: typeof data.phone === 'string' ? data.phone : '',
          homeLocality: typeof data.homeLocality === 'string' ? data.homeLocality : '',
          evVehicle: typeof data.evVehicle === 'string' ? data.evVehicle : '',
          vehicleRegNumber:
            typeof data.vehicleRegNumber === 'string' ? data.vehicleRegNumber : '',
          upiId: typeof data.upiId === 'string' ? data.upiId : '',
          gstin: typeof data.gstin === 'string' ? data.gstin : '',
          preferredCity:
            data.preferredCity && CITY_MAP_META[data.preferredCity as CityId]
              ? (data.preferredCity as CityId)
              : 'bengaluru',
          updatedAtIso,
        });
      },
      (err) => handleDbError(err, OperationType.GET, profilePath),
    );

    return () => {
      unsubDriverBookings();
      unsubHostBookings();
      unsubReceipts();
      unsubSession();
      unsubProfile();
    };
  }, [authReady, user, handleDbError]);

  const persistActiveSession = useCallback(
    async (session: LiveSession) => {
      if (!user || !user.emailVerified) return;
      const path = `users/${user.uid}/activeSession/current`;
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'activeSession', 'current'),
          buildLiveSessionPayload(session, user.uid),
        );
      } catch (err) {
        handleDbError(err, OperationType.WRITE, path);
      }
    },
    [user, handleDbError],
  );

  // 5. Real-time charging telemetry simulation loop (1-second UI tick, throttled 10s Firestore sync)
  useEffect(() => {
    if (!activeSession || activeSession.isPaused || !activeSession.cableLocked) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || prev.isPaused || !prev.cableLocked) return prev;
        if (prev.currentSoc >= prev.targetSoc) {
          const finished: LiveSession = { ...prev, livePowerKw: 0, isPaused: true };
          void persistActiveSession(finished);
          return finished;
        }

        const taperFactor = prev.currentSoc > 80 ? 0.58 : 0.92;
        const jitter = (Math.random() - 0.5) * 0.4;
        const effectiveKw = Math.max(1.8, Number((prev.maxPowerKw * taperFactor + jitter).toFixed(2)));
        const simulatedHoursDelta = 18 / 3600;
        const kwhDelta = effectiveKw * simulatedHoursDelta;
        const nextEnergy = Number((prev.energyDeliveredKwh + kwhDelta).toFixed(3));
        const socGain = (kwhDelta / prev.batteryCapacityKwh) * 100;
        const nextSoc = Math.min(prev.targetSoc, Number((prev.currentSoc + socGain).toFixed(1)));
        const nextElapsed = prev.elapsedSeconds + 18;
        const nextCost = Number((nextEnergy * prev.pricePerKwh).toFixed(2));

        const nextHistory = [...prev.powerHistory];
        const minuteNum = Math.floor(nextElapsed / 60);
        const minuteLabel = `${minuteNum}m`;
        const lastSample = nextHistory[nextHistory.length - 1];
        if (!lastSample || lastSample.minuteLabel !== minuteLabel) {
          nextHistory.push({ minuteLabel, kw: effectiveKw });
          if (nextHistory.length > 18) nextHistory.shift();
        } else {
          nextHistory[nextHistory.length - 1] = { minuteLabel, kw: effectiveKw };
        }

        const updated: LiveSession = {
          ...prev,
          elapsedSeconds: nextElapsed,
          currentSoc: nextSoc,
          livePowerKw: nextSoc >= prev.targetSoc ? 0 : effectiveKw,
          energyDeliveredKwh: nextEnergy,
          runningCostInr: nextCost,
          isPaused: nextSoc >= prev.targetSoc,
          powerHistory: nextHistory,
        };

        const now = Date.now();
        if (now - lastTelemetrySyncAtRef.current >= 10000 || updated.isPaused) {
          lastTelemetrySyncAtRef.current = now;
          void persistActiveSession(updated);
        }

        return updated;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeSession?.bookingId, activeSession?.isPaused, activeSession?.cableLocked, persistActiveSession]);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthBusy(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      pushToast({
        title: `Signed in as ${cred.user.displayName ?? cred.user.email ?? 'Driver'}`,
        description: 'Bookings, host bays, and receipts are synced live.',
        tone: 'emerald',
      });
      return cred.user;
    } catch (err) {
      const code = (err as { code?: string; message?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return null;
      }
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        pushToast({
          title: 'Domain Not Authorized for Sign-In',
          description: `Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`,
          tone: 'amber',
        });
      } else if (code === 'auth/popup-blocked') {
        pushToast({
          title: 'Sign-In Popup Blocked',
          description: 'Allow popups for this site in your browser address bar and try again.',
          tone: 'amber',
        });
      } else {
        pushToast({
          title: 'Google Sign-In Failed',
          description: code ? `Auth error (${code}). Please try again.` : 'Please allow popups for this site and try again.',
          tone: 'amber',
        });
      }
      return null;
    } finally {
      setAuthBusy(false);
    }
  }, [pushToast]);

  const signOutUser = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      pushToast({
        title: 'Signed out',
        description: 'You can still browse public charging bays.',
        tone: 'neutral',
      });
    } catch {
      pushToast({
        title: 'Sign out error',
        description: 'Please retry signing out.',
        tone: 'amber',
      });
    }
  }, [pushToast]);

  const updateUserProfile = useCallback(
    async (input: UpdateProfileInput): Promise<boolean> => {
      if (!user || !user.emailVerified || !user.email) {
        pushToast({
          title: 'Sign in required',
          description: 'Please sign in with a verified Google account to save your profile.',
          tone: 'amber',
        });
        return false;
      }

      const preferredCity: CityId = CITY_MAP_META[input.preferredCity]
        ? input.preferredCity
        : 'bengaluru';

      const payload: Record<string, unknown> = {
        uid: user.uid,
        displayName: clampString(
          input.displayName,
          100,
          user.displayName || user.email.split('@')[0] || 'EV Driver',
        ),
        email: clampString(user.email, 160),
        phone: clampString(input.phone, 20, ''),
        homeLocality: clampString(input.homeLocality, 120, ''),
        evVehicle: clampString(input.evVehicle, 100, ''),
        vehicleRegNumber: clampString(input.vehicleRegNumber.toUpperCase(), 24, ''),
        upiId: clampString(input.upiId, 80, ''),
        gstin: clampString(input.gstin.toUpperCase(), 20, ''),
        preferredCity,
        updatedAt: serverTimestamp(),
      };

      if (user.photoURL && user.photoURL.length <= 500) {
        payload.photoUrl = user.photoURL;
      } else if (userProfile?.photoUrl && userProfile.photoUrl.length <= 500) {
        payload.photoUrl = userProfile.photoUrl;
      }

      const profilePath = `users/${user.uid}/private/profile`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'private', 'profile'), payload);
        setCityState(preferredCity);
        pushToast({
          title: 'Personal Profile Saved',
          description: 'Your personal information, EV vehicle, and payout details are synced.',
          tone: 'emerald',
        });
        return true;
      } catch (err) {
        handleDbError(err, OperationType.WRITE, profilePath);
        return false;
      }
    },
    [user, userProfile?.photoUrl, pushToast, handleDbError],
  );

  const setCity = useCallback(
    (nextCity: CityId) => {
      setCityState(nextCity);
      const firstInCity = chargers.find((c) => c.city === nextCity);
      setSelectedStationId(firstInCity?.id ?? null);

      if (user && user.emailVerified && user.email) {
        const profilePath = `users/${user.uid}/private/profile`;
        void updateDoc(doc(db, 'users', user.uid, 'private', 'profile'), {
          preferredCity: nextCity,
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          handleDbError(err, OperationType.UPDATE, profilePath);
        });
      }
    },
    [chargers, user, handleDbError],
  );

  const openBookingDrawer = useCallback((stationId: string) => {
    setSelectedStationId(stationId);
    setDrawerStationId(stationId);
  }, []);

  const closeBookingDrawer = useCallback(() => {
    setDrawerStationId(null);
  }, []);

  const ensureSignedInUser = useCallback(async (): Promise<User | null> => {
    if (user && user.emailVerified) return user;
    if (user && !user.emailVerified) {
      pushToast({
        title: 'Verified Google Account Required',
        description: 'Please sign in with a verified Google account.',
        tone: 'amber',
      });
      return null;
    }
    return await signInWithGoogle();
  }, [user, signInWithGoogle, pushToast]);

  const createBooking = useCallback(
    async (input: CreateBookingInput): Promise<Booking | null> => {
      const station = chargers.find((c) => c.id === input.stationId);
      if (!station) return null;

      const activeUser = await ensureSignedInUser();
      if (!activeUser || !activeUser.emailVerified) return null;

      // Ensure station exists in Firestore if this user just signed in before seed completed
      let stationHostUid = station.hostUid;
      if (!stationHostUid) {
        const chargerRef = doc(db, 'chargers', station.id);
        try {
          await setDoc(chargerRef, buildChargerPayload(station, activeUser.uid));
          stationHostUid = activeUser.uid;
        } catch (err) {
          handleDbError(err, OperationType.CREATE, `chargers/${station.id}`);
        }
      }

      const bookingId = sanitizeId(`bk-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`);
      const { totalInr } = calculateBilling(input.targetKwh, station.pricePerKwh);
      const driverName = clampString(
        userProfile?.displayName || activeUser.displayName || activeUser.email?.split('@')[0] || 'EV Driver',
        100,
        'EV Driver',
      );
      const status: Booking['status'] = station.instantBook ? 'confirmed' : 'pending_approval';
      const nowIso = new Date().toISOString();

      const newBooking: Booking = {
        id: bookingId,
        stationId: station.id,
        stationName: clampString(station.name, 120),
        locality: clampString(station.locality, 120),
        city: station.city,
        hostName: clampString(station.hostName, 100),
        hostUid: stationHostUid,
        driverUid: activeUser.uid,
        driverName,
        vehicleModel: clampString(input.vehicleModel, 100),
        connectorType: station.connectorType,
        powerKw: station.powerKw,
        pricePerKwh: station.pricePerKwh,
        scheduledSlot: clampString(input.scheduledSlot, 60),
        targetKwh: input.targetKwh,
        estimatedTotalInr: totalInr,
        status,
        createdAt: nowIso,
      };

      const bookingPath = `bookings/${bookingId}`;
      try {
        await setDoc(doc(db, 'bookings', bookingId), {
          id: bookingId,
          stationId: sanitizeId(station.id),
          stationName: newBooking.stationName,
          locality: newBooking.locality,
          city: newBooking.city,
          hostName: newBooking.hostName,
          hostUid: stationHostUid,
          driverUid: activeUser.uid,
          driverName,
          vehicleModel: newBooking.vehicleModel,
          connectorType: newBooking.connectorType,
          powerKw: newBooking.powerKw,
          pricePerKwh: newBooking.pricePerKwh,
          scheduledSlot: newBooking.scheduledSlot,
          targetKwh: newBooking.targetKwh,
          estimatedTotalInr: newBooking.estimatedTotalInr,
          status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleDbError(err, OperationType.CREATE, bookingPath);
      }

      pushToast({
        title: station.instantBook ? 'Charging Slot Confirmed' : 'Booking Request Sent to Host',
        description: `${station.name} · ${input.scheduledSlot}`,
        tone: station.instantBook ? 'emerald' : 'amber',
      });

      return newBooking;
    },
    [chargers, ensureSignedInUser, userProfile?.displayName, pushToast, handleDbError],
  );

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      if (!user) return;
      const path = `bookings/${bookingId}`;
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
        });
        pushToast({
          title: 'Reservation Cancelled',
          description: 'No cancellation fee applied.',
          tone: 'neutral',
        });
      } catch (err) {
        handleDbError(err, OperationType.UPDATE, path);
      }
    },
    [user, pushToast, handleDbError],
  );

  const startChargingFromBooking = useCallback(
    async (bookingId: string) => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      const station = chargers.find((c) => c.id === booking.stationId);
      const vehicle =
        EV_VEHICLE_PRESETS.find((v) => v.name === booking.vehicleModel) ?? EV_VEHICLE_PRESETS[0];

      const maxPowerKw = Math.min(booking.powerKw, vehicle.maxAcceptKw);
      const initialKw = Number((maxPowerKw * 0.91).toFixed(2));
      const addedPct = Math.round((booking.targetKwh / vehicle.batteryKwh) * 100);
      const computedTargetSoc = Math.min(100, Math.max(45, 38 + addedPct));
      const newSession: LiveSession = {
        userId: user?.uid,
        bookingId: booking.id,
        stationId: booking.stationId,
        stationName: booking.stationName,
        locality: booking.locality,
        hostName: booking.hostName,
        vehicleModel: booking.vehicleModel,
        connectorType: booking.connectorType,
        maxPowerKw,
        pricePerKwh: booking.pricePerKwh,
        startTimeIso: new Date().toISOString(),
        elapsedSeconds: 18,
        startSoc: 38,
        currentSoc: 38.4,
        targetSoc: computedTargetSoc,
        batteryCapacityKwh: vehicle.batteryKwh,
        livePowerKw: initialKw,
        energyDeliveredKwh: 0.15,
        runningCostInr: Number((0.15 * booking.pricePerKwh).toFixed(2)),
        cableLocked: true,
        isPaused: false,
        powerHistory: [
          { minuteLabel: '0m', kw: Number((initialKw * 0.85).toFixed(1)) },
          { minuteLabel: '1m', kw: initialKw },
        ],
      };

      setActiveSession(newSession);
      setDrawerStationId(null);
      setActiveTab('live');

      if (user && user.emailVerified) {
        lastTelemetrySyncAtRef.current = Date.now();
        await persistActiveSession(newSession);

        try {
          await updateDoc(doc(db, 'bookings', booking.id), {
            status: 'in_session',
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleDbError(err, OperationType.UPDATE, `bookings/${booking.id}`);
        }

        if (station?.hostUid && (station.status === 'available' || station.status === 'high_demand')) {
          try {
            await updateDoc(doc(db, 'chargers', station.id), {
              status: 'occupied',
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleDbError(err, OperationType.UPDATE, `chargers/${station.id}`);
          }
        }
      }

      pushToast({
        title: 'Live Charging Session Started',
        description: `Connected to ${booking.stationName} (${maxPowerKw} kW)`,
        tone: 'blue',
      });
    },
    [bookings, chargers, user, persistActiveSession, pushToast, handleDbError],
  );

  const startQuickDemoSession = useCallback(async () => {
    const confirmedBooking = bookings.find((b) => b.status === 'confirmed');
    if (confirmedBooking) {
      await startChargingFromBooking(confirmedBooking.id);
      return;
    }

    const availableStation =
      chargers.find((c) => c.city === city && c.status === 'available') ?? chargers[0];
    if (!availableStation) return;

    const vehicle =
      EV_VEHICLE_PRESETS.find((v) => v.name === userProfile?.evVehicle) ?? EV_VEHICLE_PRESETS[0];
    const maxPowerKw = Math.min(availableStation.powerKw, vehicle.maxAcceptKw);
    const initialKw = Number((maxPowerKw * 0.92).toFixed(2));
    const demoBookingId = `bk-live-${Date.now().toString().slice(-4)}`;

    const newSession: LiveSession = {
      userId: user?.uid,
      bookingId: demoBookingId,
      stationId: availableStation.id,
      stationName: availableStation.name,
      locality: availableStation.locality,
      hostName: availableStation.hostName,
      vehicleModel: vehicle.name,
      connectorType: availableStation.connectorType,
      maxPowerKw,
      pricePerKwh: availableStation.pricePerKwh,
      startTimeIso: new Date().toISOString(),
      elapsedSeconds: 36,
      startSoc: 42,
      currentSoc: 42.6,
      targetSoc: 80,
      batteryCapacityKwh: vehicle.batteryKwh,
      livePowerKw: initialKw,
      energyDeliveredKwh: 0.48,
      runningCostInr: Number((0.48 * availableStation.pricePerKwh).toFixed(2)),
      cableLocked: true,
      isPaused: false,
      powerHistory: [
        { minuteLabel: '0m', kw: Number((initialKw * 0.88).toFixed(1)) },
        { minuteLabel: '1m', kw: initialKw },
      ],
    };

    setActiveSession(newSession);
    setActiveTab('live');

    if (user && user.emailVerified) {
      lastTelemetrySyncAtRef.current = Date.now();
      await persistActiveSession(newSession);
    }

    pushToast({
      title: 'Telemetry Stream Active',
      description: `${availableStation.name} locked and supplying ${initialKw} kW`,
      tone: 'blue',
    });
  }, [bookings, chargers, city, user, userProfile?.evVehicle, persistActiveSession, pushToast, startChargingFromBooking]);

  const toggleCableLock = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const nextLocked = !prev.cableLocked;
      const next: LiveSession = {
        ...prev,
        cableLocked: nextLocked,
        livePowerKw: nextLocked && !prev.isPaused ? prev.maxPowerKw * 0.9 : 0,
      };
      void persistActiveSession(next);
      return next;
    });
  }, [persistActiveSession]);

  const toggleSessionPause = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const nextPaused = !prev.isPaused;
      const next: LiveSession = {
        ...prev,
        isPaused: nextPaused,
        livePowerKw: nextPaused ? 0 : Number((prev.maxPowerKw * 0.91).toFixed(2)),
      };
      void persistActiveSession(next);
      return next;
    });
  }, [persistActiveSession]);

  const updateTargetSoc = useCallback(
    (soc: number) => {
      setActiveSession((prev) => {
        if (!prev) return prev;
        const clamped = Math.max(Math.ceil(prev.currentSoc + 2), Math.min(100, soc));
        const next: LiveSession = {
          ...prev,
          targetSoc: clamped,
          isPaused: clamped > prev.currentSoc ? false : prev.isPaused,
        };
        void persistActiveSession(next);
        return next;
      });
    },
    [persistActiveSession],
  );

  const stopAndPaySession = useCallback(
    async (paymentMethod: string): Promise<Receipt | null> => {
      const s = activeSessionRef.current;
      if (!s) return null;

      const energyKwh = Number(Math.max(0.25, s.energyDeliveredKwh).toFixed(2));
      const { energyChargeInr, platformFeeInr, gstInr, totalInr } = calculateBilling(
        energyKwh,
        s.pricePerKwh,
      );

      const receiptId = sanitizeId(`rc-${Date.now()}`);
      const newReceipt: Receipt = {
        id: receiptId,
        userId: user?.uid,
        invoiceNumber: `VS-IN-2026-${Math.floor(1000 + Math.random() * 8999)}`,
        sessionDateIso: new Date().toISOString(),
        stationName: clampString(s.stationName, 120),
        hostName: clampString(s.hostName, 100),
        locality: clampString(s.locality, 120),
        vehicleModel: clampString(s.vehicleModel, 100),
        connectorType: s.connectorType,
        energyKwh,
        durationSeconds: Math.max(60, Math.round(s.elapsedSeconds)),
        ratePerKwh: s.pricePerKwh,
        energyChargeInr,
        platformFeeInr,
        gstInr,
        totalPaidInr: totalInr,
        co2SavedKg: Number((energyKwh * 0.82).toFixed(1)),
        paymentMethod: clampString(paymentMethod, 60),
      };

      setActiveSession(null);

      if (user && user.emailVerified) {
        const receiptPath = `users/${user.uid}/receipts/${receiptId}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'receipts', receiptId), {
            ...newReceipt,
            userId: user.uid,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleDbError(err, OperationType.CREATE, receiptPath);
        }

        try {
          await deleteDoc(doc(db, 'users', user.uid, 'activeSession', 'current'));
        } catch (err) {
          handleDbError(err, OperationType.DELETE, `users/${user.uid}/activeSession/current`);
        }

        const matchedBooking = bookings.find((b) => b.id === s.bookingId);
        if (matchedBooking && matchedBooking.status !== 'completed' && matchedBooking.status !== 'cancelled') {
          try {
            await updateDoc(doc(db, 'bookings', matchedBooking.id), {
              status: 'completed',
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleDbError(err, OperationType.UPDATE, `bookings/${matchedBooking.id}`);
          }
        }

        const matchedStation = chargers.find((c) => c.id === s.stationId);
        if (matchedStation?.hostUid && matchedStation.status !== 'maintenance') {
          try {
            await updateDoc(doc(db, 'chargers', matchedStation.id), {
              status: 'available',
              totalSessions: matchedStation.totalSessions + 1,
              totalEnergyKwh: Number((matchedStation.totalEnergyKwh + energyKwh).toFixed(1)),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleDbError(err, OperationType.UPDATE, `chargers/${matchedStation.id}`);
          }
        }
      } else {
        setReceipts((prev) => [newReceipt, ...prev]);
      }

      setActiveTab('trips');
      pushToast({
        title: `Paid ₹${totalInr.toFixed(2)} via ${paymentMethod}`,
        description: `GST Invoice ${newReceipt.invoiceNumber} saved to Trips & Receipts.`,
        tone: 'emerald',
      });

      return newReceipt;
    },
    [user, bookings, chargers, pushToast, handleDbError],
  );

  const toggleChargerStatus = useCallback(
    async (stationId: string, status: ChargerStatus) => {
      const activeUser = await ensureSignedInUser();
      if (!activeUser || !activeUser.emailVerified) return;

      const station = chargers.find((c) => c.id === stationId);
      if (!station?.hostUid) return;

      const path = `chargers/${stationId}`;
      try {
        await updateDoc(doc(db, 'chargers', stationId), {
          status,
          updatedAt: serverTimestamp(),
        });
        pushToast({
          title: 'Charger Status Updated',
          description: `Bay state changed to ${status.replace('_', ' ')}.`,
          tone: status === 'available' ? 'emerald' : 'neutral',
        });
      } catch (err) {
        handleDbError(err, OperationType.UPDATE, path);
      }
    },
    [chargers, ensureSignedInUser, pushToast, handleDbError],
  );

  const updateChargerPrice = useCallback(
    async (stationId: string, newPrice: number) => {
      const activeUser = await ensureSignedInUser();
      if (!activeUser || !activeUser.emailVerified) return;

      const clamped = Math.max(6, Math.min(45, Number(newPrice.toFixed(2))));
      const path = `chargers/${stationId}`;
      try {
        await updateDoc(doc(db, 'chargers', stationId), {
          pricePerKwh: clamped,
          updatedAt: serverTimestamp(),
        });
        pushToast({
          title: `Tariff Updated to ₹${clamped.toFixed(2)}/kWh`,
          description: 'Live rate reflected across Driver Map & Discovery.',
          tone: 'emerald',
        });
      } catch (err) {
        handleDbError(err, OperationType.UPDATE, path);
      }
    },
    [ensureSignedInUser, pushToast, handleDbError],
  );

  const approveBooking = useCallback(
    async (bookingId: string) => {
      if (!user) return;
      const path = `bookings/${bookingId}`;
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'confirmed',
          updatedAt: serverTimestamp(),
        });
        pushToast({
          title: 'Booking Request Approved',
          description: 'Driver notified with bay gate access code.',
          tone: 'emerald',
        });
      } catch (err) {
        handleDbError(err, OperationType.UPDATE, path);
      }
    },
    [user, pushToast, handleDbError],
  );

  const declineBooking = useCallback(
    async (bookingId: string) => {
      if (!user) return;
      const path = `bookings/${bookingId}`;
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
        });
        pushToast({
          title: 'Booking Declined',
          description: 'Slot remains open for other drivers.',
          tone: 'neutral',
        });
      } catch (err) {
        handleDbError(err, OperationType.UPDATE, path);
      }
    },
    [user, pushToast, handleDbError],
  );

  const addNewCharger = useCallback(
    async (input: NewChargerInput): Promise<ChargerStation | null> => {
      const activeUser = await ensureSignedInUser();
      if (!activeUser || !activeUser.emailVerified) return null;

      const imageUrl =
        input.connectorType === 'CCS2'
          ? STATION_IMAGES.solarHub
          : input.powerKw >= 11
            ? STATION_IMAGES.apartmentBay
            : STATION_IMAGES.driveway;

      const id = sanitizeId(`st-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`);
      const newStation: ChargerStation = {
        id,
        name: clampString(input.name, 120),
        city: input.city,
        locality: clampString(input.locality, 120),
        address: clampString(
          input.address || `${input.locality}, ${CITY_MAP_META[input.city].name}`,
          260,
        ),
        hostName: clampString(input.hostName || activeUser.displayName || 'Community Host', 100),
        hostUid: activeUser.uid,
        hostVerified: true,
        hostSince: '2026',
        hostRating: 5.0,
        reviewCount: 1,
        connectorType: input.connectorType,
        powerKw: Number(Math.max(1.5, Math.min(350, input.powerKw)).toFixed(1)),
        isFastDc: input.connectorType === 'CCS2' && input.powerKw >= 20,
        pricePerKwh: Number(Math.max(5, Math.min(60, input.pricePerKwh)).toFixed(2)),
        status: 'available',
        distanceKm: Number((1.1 + Math.random() * 2.5).toFixed(1)),
        coordinates: {
          lat: Number(
            (CITY_MAP_META[input.city].center.lat + (Math.random() - 0.5) * 0.035).toFixed(5),
          ),
          lng: Number(
            (CITY_MAP_META[input.city].center.lng + (Math.random() - 0.5) * 0.035).toFixed(5),
          ),
        },
        amenities:
          input.amenities.length > 0
            ? input.amenities.map((a) => clampString(a, 60)).slice(0, 12)
            : ['Covered Parking', 'CCTV'],
        imageUrl,
        hostAvatarUrl:
          activeUser.photoURL && activeUser.photoURL.length <= 500
            ? activeUser.photoURL
            : STATION_IMAGES.hostPortrait,
        instantBook: input.instantBook,
        totalSessions: 0,
        totalEnergyKwh: 0,
        isPublished: true,
      };

      const path = `chargers/${id}`;
      try {
        await setDoc(doc(db, 'chargers', id), buildChargerPayload(newStation, activeUser.uid));
      } catch (err) {
        handleDbError(err, OperationType.CREATE, path);
      }

      setCityState(input.city);
      setSelectedStationId(newStation.id);
      setAddChargerOpen(false);
      pushToast({
        title: 'Charger Listed Live on chargeShare',
        description: `${newStation.name} pinned on the ${CITY_MAP_META[input.city].name} map for all drivers.`,
        tone: 'emerald',
      });
      return newStation;
    },
    [ensureSignedInUser, pushToast, handleDbError],
  );

  const resetDemoData = useCallback(async () => {
    const activeUser = await ensureSignedInUser();
    if (!activeUser || !activeUser.emailVerified) return;

    const batch = writeBatch(db);
    for (const st of INITIAL_CHARGERS) {
      const existing = chargers.find((c) => c.id === st.id);
      // Only overwrite seed stations the user owns (or admin owns)
      if (!existing?.hostUid || existing.hostUid === activeUser.uid || isAdmin) {
        batch.set(doc(db, 'chargers', st.id), buildChargerPayload(st, existing?.hostUid ?? activeUser.uid));
      }
    }

    try {
      await batch.commit();
      setSelectedStationId(INITIAL_CHARGERS[0]?.id ?? null);
      setDrawerStationId(null);
      pushToast({
        title: 'Marketplace Stations Synced',
        description: 'Restored preloaded Indian EV network stations in Firestore.',
        tone: 'neutral',
      });
    } catch (err) {
      handleDbError(err, OperationType.WRITE, 'chargers');
    }
  }, [ensureSignedInUser, chargers, isAdmin, pushToast, handleDbError]);

  return (
    <MarketplaceContext.Provider
      value={{
        user,
        userProfile,
        authReady,
        authBusy,
        isAdmin,
        firestoreQuotaExceeded,
        signInWithGoogle,
        signOutUser,
        updateUserProfile,
        activeTab,
        setActiveTab,
        city,
        setCity,
        chargers,
        chargersLoading,
        bookings,
        receipts,
        activeSession,
        selectedStationId,
        setSelectedStationId,
        drawerStationId,
        openBookingDrawer,
        closeBookingDrawer,
        isAddChargerOpen,
        setAddChargerOpen,
        toasts,
        dismissToast,
        createBooking,
        cancelBooking,
        startChargingFromBooking,
        startQuickDemoSession,
        toggleCableLock,
        toggleSessionPause,
        updateTargetSoc,
        stopAndPaySession,
        toggleChargerStatus,
        updateChargerPrice,
        approveBooking,
        declineBooking,
        addNewCharger,
        resetDemoData,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error('useMarketplace must be used within MarketplaceProvider');
  return ctx;
}
