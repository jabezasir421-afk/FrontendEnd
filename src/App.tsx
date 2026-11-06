import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SearchFilter } from './components/SearchFilter';
import { WorkerCard } from './components/WorkerCard';
import { WorkerCardSkeleton } from './components/SkeletonLoader';
import { WorkerDetailModal } from './components/WorkerDetailModal';
import { BookingModal } from './components/BookingModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { WorkerProfile, Category, Address } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const { role } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('directory');

  // Categories & Workers
  const [categories, setCategories] = useState<Category[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(1);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [maxHourlyRate, setMaxHourlyRate] = useState<number>(150);
  const [minRating, setMinRating] = useState<number>(0);

  // Modals
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [bookingWorker, setBookingWorker] = useState<WorkerProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Load initial data
  const loadInitialData = async () => {
    try {
      const [cats, addrs, notifs] = await Promise.all([
        api.getCategories(),
        api.getMyAddresses(),
        api.getNotifications(),
      ]);
      setCategories(cats);
      setSavedAddresses(addrs);
      setUnreadNotifCount(notifs.filter(n => !n.read).length);
    } catch {
      // fallback
    }
  };

  const refreshNotifCount = async () => {
    try {
      const notifs = await api.getNotifications();
      setUnreadNotifCount(notifs.filter(n => !n.read).length);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch search results whenever filters change
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const res = await api.searchWorkers({
          categoryId: selectedCategory || undefined,
          city: selectedCity || undefined,
          verified: verifiedOnly ? true : undefined,
          available: availableOnly ? true : undefined,
          maxPrice: maxHourlyRate,
          minRating: minRating > 0 ? minRating : undefined,
        });
        setWorkers(res.results);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, [selectedCategory, selectedCity, verifiedOnly, availableOnly, maxHourlyRate, minRating]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedCity('');
    setVerifiedOnly(false);
    setAvailableOnly(false);
    setMaxHourlyRate(150);
    setMinRating(0);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Accessible Skip Link */}
      <a href="#main-content" className="skip-link">
        SKIP TO MAIN CONTENT [TAB]
      </a>

      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadNotifCount={unreadNotifCount}
      />

      {/* Main Content Areas */}
      <main id="main-content" tabIndex={-1} style={{ flex: 1, outline: 'none' }}>
        {currentTab === 'directory' && (
          <>
            {/* Swiss Hero */}
            <HeroSection
              onExploreClick={() => {
                const el = document.getElementById('directory-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onPostRequestClick={() => {
                if (workers[0]) setBookingWorker(workers[0]);
              }}
            />

            {/* 6 Disciplines Modular Selection Grid */}
            <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 2rem 2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                <span className="eyebrow" style={{ fontSize: '0.75rem', margin: 0 }}>
                  TAXONOMY QUICK FILTER // 6 RECOGNIZED DISCIPLINES
                </span>
                {selectedCategory && (
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', color: 'var(--red)', fontWeight: 600 }}
                    onClick={() => setSelectedCategory('')}
                  >
                    CLEAR SELECTION [×]
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
                {categories.map((c, i) => {
                  const isSelected = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? '' : c.id)}
                      style={{
                        border: isSelected ? '2px solid var(--red)' : '1px solid var(--black)',
                        background: isSelected ? 'var(--black)' : 'var(--white)',
                        color: isSelected ? 'var(--white)' : 'var(--black)',
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <span className="mono-num" style={{ fontSize: '0.7rem', display: 'block', color: isSelected ? 'var(--red)' : 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        0{i + 1}
                      </span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: '1.2' }}>
                        {c.name.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                        {c.workerCount || 10} specialists
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtering Control Bar */}
            <SearchFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              verifiedOnly={verifiedOnly}
              onToggleVerified={setVerifiedOnly}
              availableOnly={availableOnly}
              onToggleAvailable={setAvailableOnly}
              maxHourlyRate={maxHourlyRate}
              onChangeMaxHourlyRate={setMaxHourlyRate}
              minRating={minRating}
              onChangeMinRating={setMinRating}
              onResetFilters={handleResetFilters}
              totalResults={workers.length}
            />

            {/* 12-Column Worker Directory Grid */}
            <section id="directory-grid" className="container" style={{ padding: '3.5rem 2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
                <div>
                  <span className="eyebrow" style={{ margin: 0 }}>
                    ROSTER OF CERTIFIED TRADES // SECTION 01
                  </span>
                  <h2 style={{ marginTop: '0.25rem' }}>
                    Active Trade Practitioners
                  </h2>
                </div>
                <span className="mono-num" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Total Matches: {workers.length}
                </span>
              </div>

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.75rem' }}>
                  <div style={{ gridColumn: 'span 4' }}><WorkerCardSkeleton /></div>
                  <div style={{ gridColumn: 'span 4' }}><WorkerCardSkeleton /></div>
                  <div style={{ gridColumn: 'span 4' }}><WorkerCardSkeleton /></div>
                </div>
              ) : workers.length === 0 ? (
                <div style={{ border: '1px solid var(--rule)', padding: '4rem', textAlign: 'center', background: 'var(--gray)' }}>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    No specialists found matching current parameter constraints.
                  </p>
                  <button
                    type="button"
                    className="button button--sm"
                    onClick={handleResetFilters}
                  >
                    RESET PARAMETERS
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.75rem' }}>
                  {workers.map((worker) => (
                    <div key={worker.id} style={{ gridColumn: 'span 4' }}>
                      <WorkerCard
                        worker={worker}
                        onViewDossier={(w) => setSelectedWorker(w)}
                        onBookNow={(w) => setBookingWorker(w)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {currentTab === 'customer' && <CustomerDashboard />}

        {currentTab === 'worker' && <WorkerDashboard />}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Modals */}
      {selectedWorker && (
        <WorkerDetailModal
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onBookNow={(w) => {
            setSelectedWorker(null);
            setBookingWorker(w);
          }}
        />
      )}

      {bookingWorker && (
        <BookingModal
          worker={bookingWorker}
          savedAddresses={savedAddresses}
          onClose={() => setBookingWorker(null)}
          onSuccess={() => {
            setBookingWorker(null);
            setCurrentTab('customer');
          }}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          categories={categories}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNotificationRead={refreshNotifCount}
      />

      {/* Swiss Modernism 2.0 Systematic Footer */}
      <footer style={{ borderTop: '1px solid var(--black)', background: 'var(--white)', padding: '3.5rem 2rem 2.5rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', paddingBottom: '3rem', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ gridColumn: 'span 4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div className="logo-square" />
                <strong style={{ fontSize: '1.1rem', letterSpacing: '0.02em' }}>BLUECOLLAR TRADE PLATFORM</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Standardized Swiss International trade infrastructure. Mathematical grid systems, verified trade licensing, deterministic dispatching, and zero ambiguity.
              </p>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>DIRECTORY</span>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <li>Electrical</li>
                <li>Sanitary & Plumbing</li>
                <li>Carpentry & Joinery</li>
                <li>HVAC Systems</li>
                <li>Structural Masonry</li>
              </ul>
            </div>

            <div style={{ gridColumn: 'span 3' }}>
              <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>STANDARDS & ACCREDITATION</span>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <li>ISO 9001 Quality Management</li>
                <li>Swiss Federal VET Directives</li>
                <li>Mandatory Liability Verification</li>
                <li>Continuous In-Service Audits</li>
              </ul>
            </div>

            <div style={{ gridColumn: 'span 3' }}>
              <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>SPECIFICATION 2.0</span>
              <div style={{ background: 'var(--gray)', padding: '0.85rem', border: '1px solid var(--rule)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                <div><strong>Grid:</strong> 12 Columns (2rem gap)</div>
                <div><strong>Palette:</strong> #000000 / #FFFFFF / #F5F5F5 / #DC2626</div>
                <div><strong>Type:</strong> Helvetica Neue / Inter</div>
                <div><strong>Contrast:</strong> WCAG AA Conformance</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>
              © 2026 BlueCollar Infrastructure. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span>Strict Grid</span>
              <span>•</span>
              <span>Hairline Rules</span>
              <span>•</span>
              <span>Zero Radius</span>
              <span>•</span>
              <span>DIN 1451 Alignment</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
