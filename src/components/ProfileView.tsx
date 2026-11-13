import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  CarFront,
  Check,
  CreditCard,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { CITY_MAP_META, EV_VEHICLE_PRESETS } from '../data/seedData';
import { useMarketplace } from '../context/MarketplaceContext';
import { CityId } from '../types/marketplace';
import { ResilientImage } from './ResilientImage';

export function ProfileView() {
  const {
    user,
    userProfile,
    authReady,
    authBusy,
    signInWithGoogle,
    signOutUser,
    updateUserProfile,
    bookings,
    receipts,
    chargers,
    city,
  } = useMarketplace();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [homeLocality, setHomeLocality] = useState('');
  const [evVehicle, setEvVehicle] = useState('');
  const [vehicleRegNumber, setVehicleRegNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [gstin, setGstin] = useState('');
  const [preferredCity, setPreferredCity] = useState<CityId>(city);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(userProfile?.displayName || user.displayName || user.email?.split('@')[0] || '');
    setPhone(userProfile?.phone ?? '');
    setHomeLocality(userProfile?.homeLocality ?? '');
    setEvVehicle(userProfile?.evVehicle ?? '');
    setVehicleRegNumber(userProfile?.vehicleRegNumber ?? '');
    setUpiId(userProfile?.upiId ?? '');
    setGstin(userProfile?.gstin ?? '');
    setPreferredCity(userProfile?.preferredCity ?? city);
  }, [user, userProfile, city]);

  const hostedBaysCount = user
    ? chargers.filter((c) => c.hostUid === user.uid).length
    : 0;

  const isDirty =
    Boolean(user) &&
    (displayName.trim() !== (userProfile?.displayName || user?.displayName || '').trim() ||
      phone.trim() !== (userProfile?.phone ?? '').trim() ||
      homeLocality.trim() !== (userProfile?.homeLocality ?? '').trim() ||
      evVehicle !== (userProfile?.evVehicle ?? '') ||
      vehicleRegNumber.trim().toUpperCase() !== (userProfile?.vehicleRegNumber ?? '').trim().toUpperCase() ||
      upiId.trim() !== (userProfile?.upiId ?? '').trim() ||
      gstin.trim().toUpperCase() !== (userProfile?.gstin ?? '').trim().toUpperCase() ||
      preferredCity !== (userProfile?.preferredCity ?? city));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    if (!displayName.trim()) return;

    setSaving(true);
    try {
      const ok = await updateUserProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
        homeLocality: homeLocality.trim(),
        evVehicle,
        vehicleRegNumber: vehicleRegNumber.trim().toUpperCase(),
        upiId: upiId.trim(),
        gstin: gstin.trim().toUpperCase(),
        preferredCity,
      });
      if (ok) {
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 2600);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!authReady) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-8">
        <div className="h-48 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-10 pb-24 md:px-8 md:pb-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669]">
            <UserIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[#0F172A]">
            Your Personal EV &amp; Host Profile
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Sign in with Google to manage your personal contact details, primary electric vehicle specs,
            UPI payout handle, and GST billing preferences.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                <CarFront className="h-4 w-4 text-[#059669]" />
                <span>EV Garage Defaults</span>
              </div>
              <p className="mt-1 text-[11px] text-[#64748B]">
                Pre-fills your vehicle battery size &amp; max kW rate on every booking.
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
                <span>Private Account Vault</span>
              </div>
              <p className="mt-1 text-[11px] text-[#64748B]">
                Phone, UPI ID, and GSTIN stay private to your account only.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={authBusy}
            onClick={() => void signInWithGoogle()}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#059669] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#047857] disabled:opacity-60 cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>{authBusy ? 'Signing in...' : 'Sign In with Google'}</span>
          </button>
        </div>
      </div>
    );
  }

  const avatarSrc = userProfile?.photoUrl || user.photoURL;
  const activeDisplayName = userProfile?.displayName || user.displayName || 'EV Driver';

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-12">
      {/* Page Header & Account Banner */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 md:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            {avatarSrc ? (
              <ResilientImage
                src={avatarSrc}
                alt={activeDisplayName}
                className="h-16 w-16 shrink-0 rounded-2xl border border-[#E2E8F0] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#059669]/15 font-display text-2xl font-bold text-[#047857]">
                {activeDisplayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl md:text-2xl font-bold text-[#0F172A] truncate">
                  {activeDisplayName}
                </h1>
                {user.emailVerified && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-semibold text-[#047857]">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    <span>Verified Account</span>
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-[#475569] truncate">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>{CITY_MAP_META[preferredCity].name}</span>
                </span>
                {userProfile?.evVehicle && (
                  <span className="inline-flex items-center gap-1 font-medium text-[#334155]">
                    <CarFront className="h-3.5 w-3.5 text-[#059669]" />
                    <span>{userProfile.evVehicle}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-center">
              <div>
                <div className="font-mono text-base font-bold text-[#0F172A] tabular-nums">
                  {bookings.length}
                </div>
                <div className="text-[11px] text-[#64748B]">Bookings</div>
              </div>
              <div className="border-x border-[#E2E8F0] px-3">
                <div className="font-mono text-base font-bold text-[#059669] tabular-nums">
                  {receipts.length}
                </div>
                <div className="text-[11px] text-[#64748B]">Receipts</div>
              </div>
              <div>
                <div className="font-mono text-base font-bold text-[#2563EB] tabular-nums">
                  {hostedBaysCount}
                </div>
                <div className="text-[11px] text-[#64748B]">Host Bays</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void signOutUser()}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-xs font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Personal Information & EV Details Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: Personal & Contact Details */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 md:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3.5">
              <UserIcon className="h-4 w-4 text-[#059669]" />
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Personal Information
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="profile-display-name"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Full Name
                </label>
                <input
                  id="profile-display-name"
                  type="text"
                  required
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="flex items-center justify-between text-xs font-semibold text-[#0F172A]"
                >
                  <span>Email Address</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B]">
                    <Lock className="h-3 w-3" />
                    <span>Managed by Google</span>
                  </span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  readOnly
                  value={user.email ?? ''}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#64748B] cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-phone"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    Mobile / WhatsApp
                  </label>
                  <div className="relative mt-1.5">
                    <Phone className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-[#64748B]" />
                    <input
                      id="profile-phone"
                      type="tel"
                      maxLength={20}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white pr-3 pl-9 font-mono text-sm text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-city"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    Default City Grid
                  </label>
                  <select
                    id="profile-city"
                    value={preferredCity}
                    onChange={(e) => setPreferredCity(e.target.value as CityId)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  >
                    {(Object.keys(CITY_MAP_META) as CityId[]).map((cId) => (
                      <option key={cId} value={cId}>
                        {CITY_MAP_META[cId].name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-locality"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Home Locality / Neighborhood
                </label>
                <input
                  id="profile-locality"
                  type="text"
                  maxLength={120}
                  value={homeLocality}
                  onChange={(e) => setHomeLocality(e.target.value)}
                  placeholder="e.g., Indiranagar 100ft Road, Bengaluru"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
                />
              </div>
            </div>
          </section>

          {/* Card 2: EV Garage & Payout / GST Details */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 md:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3.5">
              <CarFront className="h-4 w-4 text-[#2563EB]" />
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                EV Garage &amp; Billing Preferences
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="profile-ev-vehicle"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Primary Electric Vehicle
                </label>
                <select
                  id="profile-ev-vehicle"
                  value={evVehicle}
                  onChange={(e) => setEvVehicle(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="">Select your default EV (used in booking estimates)</option>
                  {EV_VEHICLE_PRESETS.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.batteryKwh} kWh · max {v.maxAcceptKw} kW)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="profile-reg-number"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Vehicle Registration Plate
                </label>
                <input
                  id="profile-reg-number"
                  type="text"
                  maxLength={24}
                  value={vehicleRegNumber}
                  onChange={(e) => setVehicleRegNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., KA 03 EV 2048"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 font-mono text-sm uppercase text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-upi"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    UPI ID (Payouts &amp; Refunds)
                  </label>
                  <div className="relative mt-1.5">
                    <CreditCard className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-[#64748B]" />
                    <input
                      id="profile-upi"
                      type="text"
                      maxLength={80}
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="name@okhdfcbank"
                      className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white pr-3 pl-9 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-gstin"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    Business GSTIN (Optional)
                  </label>
                  <input
                    id="profile-gstin"
                    type="text"
                    maxLength={20}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="29ABCDE1234F1Z5"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 font-mono text-sm uppercase text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs text-[#475569]">
                <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                  <ShieldCheck className="h-4 w-4 text-[#059669]" />
                  <span>Private Profile Storage</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
                  Personal phone, UPI ID, and GSTIN are stored under your private user document and
                  are never shown on public charger listings.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Save Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="text-xs text-[#475569]">
            {justSaved ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#059669]">
                <Check className="h-4 w-4" />
                <span>All personal information synced to your account.</span>
              </span>
            ) : isDirty ? (
              <span className="font-medium text-[#D97706]">You have unsaved changes.</span>
            ) : (
              <span>
                {userProfile?.updatedAtIso
                  ? `Last synced ${new Date(userProfile.updatedAtIso).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : 'Profile synced with your Google account.'}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !displayName.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#059669] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#047857] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Personal Info'}
          </button>
        </div>
      </form>
    </div>
  );
}
