import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  unreadNotifCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  onSelectTab, 
  onOpenAuth,
  onOpenNotifications,
  unreadNotifCount
}) => {
  const { user, role, switchRole, logout, isBackendOnline, refreshBackendStatus } = useAuth();

  return (
    <header className="header-bar" role="banner">
      <div className="header-inner">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <button 
            type="button"
            onClick={() => onSelectTab('directory')}
            className="logo-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="BlueCollar Home"
          >
            <div className="logo-square" aria-hidden="true" />
            <span style={{ letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              BLUECOLLAR<span style={{ color: 'var(--red)' }}>.</span>
            </span>
          </button>

          {/* Nav Links */}
          <nav aria-label="Main Navigation" style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`nav-link ${currentTab === 'directory' ? 'nav-link--active' : ''}`}
              onClick={() => onSelectTab('directory')}
              style={{ background: 'none', border: 'none' }}
            >
              DIRECTORY
            </button>
            <button
              type="button"
              className={`nav-link ${currentTab === 'customer' ? 'nav-link--active' : ''}`}
              onClick={() => onSelectTab('customer')}
              style={{ background: 'none', border: 'none' }}
            >
              CUSTOMER PORTAL
            </button>
            <button
              type="button"
              className={`nav-link ${currentTab === 'worker' ? 'nav-link--active' : ''}`}
              onClick={() => onSelectTab('worker')}
              style={{ background: 'none', border: 'none' }}
            >
              WORKER DESK
            </button>
            <button
              type="button"
              className={`nav-link ${currentTab === 'admin' ? 'nav-link--active' : ''}`}
              onClick={() => onSelectTab('admin')}
              style={{ background: 'none', border: 'none' }}
            >
              ADMINISTRATION
            </button>
          </nav>
        </div>

        {/* Right Status & Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Backend Status indicator */}
          <button
            type="button"
            onClick={refreshBackendStatus}
            title={isBackendOnline ? "Connected to Spring Boot API (:8080)" : "Running in Client Demo Mode (Backend offline or local)"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.25rem 0.5rem',
              border: '1px solid var(--rule)',
              background: 'var(--gray)',
              cursor: 'pointer',
              color: 'var(--black)',
              letterSpacing: '0.05em',
            }}
            aria-label="Refresh Backend Connection Status"
          >
            <span 
              className={`status-pill ${isBackendOnline ? 'status-pill--active' : 'status-pill--pending'}`}
              aria-hidden="true"
            />
            {isBackendOnline ? 'API: LIVE (8080)' : 'API: DEMO RUNTIME'}
          </button>

          {/* Quick Role Switcher for Hackathon Judges & Evaluators */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--black)' }} role="group" aria-label="Role View Selector">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', background: 'var(--black)', color: 'var(--white)' }}>
              VIEW AS:
            </span>
            {(['CUSTOMER', 'WORKER', 'ADMIN'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  switchRole(r);
                  if (r === 'CUSTOMER') onSelectTab('customer');
                  else if (r === 'WORKER') onSelectTab('worker');
                  else if (r === 'ADMIN') onSelectTab('admin');
                }}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  borderLeft: '1px solid var(--black)',
                  cursor: 'pointer',
                  background: role === r ? 'var(--red)' : 'var(--white)',
                  color: role === r ? 'var(--white)' : 'var(--black)',
                  transition: 'background-color 150ms ease',
                }}
                aria-pressed={role === r}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Notifications Trigger Button */}
          <button
            type="button"
            className="button button--sm button--outline"
            onClick={onOpenNotifications}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            aria-label={`Open notifications, ${unreadNotifCount} unread`}
          >
            <span>ALERTS</span>
            {unreadNotifCount > 0 ? (
              <span style={{ background: 'var(--red)', color: 'var(--white)', padding: '0.1rem 0.35rem', fontSize: '0.7rem', fontWeight: 700 }}>
                {unreadNotifCount}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>0</span>
            )}
          </button>

          {/* User / Auth trigger */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {user.fullName}
              </span>
              <button
                type="button"
                className="button button--sm button--outline"
                onClick={logout}
                aria-label="Sign out"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="button button--sm"
              onClick={onOpenAuth}
            >
              AUTHENTICATE
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
