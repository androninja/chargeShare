import { useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AddChargerModal } from './components/AddChargerModal';
import { BookingDrawer } from './components/BookingDrawer';
import { DiscoverView } from './components/DiscoverView';
import { HostConsoleView } from './components/HostConsoleView';
import { LiveSessionView } from './components/LiveSessionView';
import { ProfileView } from './components/ProfileView';
import { ToastStack } from './components/ToastStack';
import { TopNav } from './components/TopNav';
import { TripsView } from './components/TripsView';
import { FIRESTORE_UPGRADE_URL } from './firebase';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';

const MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
  (process.env.GOOGLE_MAPS_API_KEY as string | undefined) ||
  '';

function ChargeShareShell({ quotaExceeded }: { quotaExceeded: boolean }) {
  const { activeTab, firestoreQuotaExceeded } = useMarketplace();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      {firestoreQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Firestore free-tier daily quota reached (resets tomorrow). App owner can upgrade in{' '}
            <a
              href={FIRESTORE_UPGRADE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              Firebase Console
            </a>
            .
          </span>
        </div>
      )}
      <TopNav />
      <main>
        {activeTab === 'discover' && <DiscoverView />}
        {activeTab === 'live' && <LiveSessionView />}
        {activeTab === 'trips' && <TripsView />}
        {activeTab === 'host' && <HostConsoleView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>
      <BookingDrawer />
      <AddChargerModal />
      <ToastStack />
    </div>
  );
}

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const appTree = (
    <MarketplaceProvider>
      <ChargeShareShell quotaExceeded={quotaExceeded} />
    </MarketplaceProvider>
  );

  if (!MAPS_API_KEY) {
    return appTree;
  }

  return (
    <APIProvider apiKey={MAPS_API_KEY} libraries={['marker']} language="en" region="IN">
      {appTree}
    </APIProvider>
  );
}
