import { Activity, Compass, LayoutGrid, LogIn, LogOut, Plus, ReceiptText, User } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { AppTab } from '../types/marketplace';
import { ResilientImage } from './ResilientImage';

const NAV_ITEMS: Array<{ id: AppTab; label: string }> = [
  { id: 'discover', label: 'Discover' },
  { id: 'live', label: 'Live Session' },
  { id: 'trips', label: 'Trips & Receipts' },
  { id: 'host', label: 'Host Console' },
  { id: 'profile', label: 'Profile' },
];

export function TopNav() {
  const {
    user,
    userProfile,
    authReady,
    authBusy,
    signInWithGoogle,
    signOutUser,
    activeTab,
    setActiveTab,
    setAddChargerOpen,
    activeSession,
  } = useMarketplace();

  return (
    <>
      <header className="sticky top-0 z-30 h-14 md:h-16 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 md:gap-8 px-4 md:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className="font-display text-xl font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 rounded cursor-pointer"
          >
            charge<span className="text-[#059669]">Share</span>
          </button>

          {/* Zone 2: 4 single-line text navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 rounded cursor-pointer ${
                    isActive
                      ? 'text-[#059669] font-semibold'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {item.label}
                    {item.id === 'live' && activeSession && (
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full bg-[#2563EB]"
                        aria-label="Active charging session"
                      />
                    )}
                  </span>
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-[19px] h-0.5 bg-[#059669]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA + Compact Account Auth Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setAddChargerOpen(true)}
              className="inline-flex h-9 md:h-10 items-center gap-1.5 rounded-lg bg-[#059669] px-3 md:px-4 text-xs md:text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#047857] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">List Your Charger</span>
              <span className="sm:hidden">List Bay</span>
            </button>

            {authReady &&
              (user ? (
                <div
                  className={`flex items-center gap-1 rounded-lg border pl-1.5 pr-1 py-1 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-[#059669] bg-[#ECFDF5]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    title="View & edit personal profile"
                    className="flex items-center gap-2 rounded-md px-1 py-0.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
                  >
                    {user.photoURL ? (
                      <ResilientImage
                        src={user.photoURL}
                        alt={userProfile?.displayName ?? user.displayName ?? 'User profile'}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#059669]/15 text-[11px] font-bold text-[#047857]">
                        {(userProfile?.displayName ?? user.displayName ?? user.email ?? 'U')
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                    )}
                    <span className="hidden lg:inline max-w-[110px] truncate text-xs font-medium text-[#0F172A]">
                      {(userProfile?.displayName ?? user.displayName)?.split(' ')[0] ??
                        user.email?.split('@')[0]}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void signOutUser()}
                    aria-label="Sign out"
                    title="Sign out"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-white hover:text-[#0F172A] cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex h-9 md:h-10 items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 text-xs md:text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#94A3B8] hover:bg-[#F8FAFC] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>{authBusy ? 'Signing in...' : 'Sign In'}</span>
                </button>
              ))}
          </div>
        </div>
      </header>

      {/* Mobile thumb-zone bottom tab bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-30 grid h-14 grid-cols-5 border-t border-[#E2E8F0] bg-white/95 backdrop-blur-md md:hidden"
      >
        <button
          type="button"
          onClick={() => setActiveTab('discover')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeTab === 'discover' ? 'text-[#059669]' : 'text-[#64748B]'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span>Discover</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeTab === 'live' ? 'text-[#2563EB]' : 'text-[#64748B]'
          }`}
        >
          <Activity className="h-5 w-5" />
          <span>Live</span>
          {activeSession && (
            <span className="absolute top-2 right-[28%] h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trips')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeTab === 'trips' ? 'text-[#059669]' : 'text-[#64748B]'
          }`}
        >
          <ReceiptText className="h-5 w-5" />
          <span>Trips</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('host')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeTab === 'host' ? 'text-[#059669]' : 'text-[#64748B]'
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
          <span>Host</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeTab === 'profile' ? 'text-[#059669]' : 'text-[#64748B]'
          }`}
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </button>
      </nav>
    </>
  );
}
