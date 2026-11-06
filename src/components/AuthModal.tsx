import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Category } from '../types';

interface AuthModalProps {
  onClose: () => void;
  categories: Category[];
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, categories }) => {
  const { login, switchRole } = useAuth();
  const [tab, setTab] = useState<'LOGIN' | 'REG_CUSTOMER' | 'REG_WORKER'>('LOGIN');

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [hourlyRate, setHourlyRate] = useState<number>(85);
  const [city, setCity] = useState<string>('Zurich');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'LOGIN') {
        await login(email, password);
        onClose();
      } else if (tab === 'REG_CUSTOMER') {
        await api.registerCustomer({ email, password, fullName, phoneNumber });
        await login(email, password);
        onClose();
      } else if (tab === 'REG_WORKER') {
        await api.registerWorker({ email, password, fullName, phoneNumber, categoryId, hourlyRate, city });
        await login(email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  const quickAuth = (role: 'CUSTOMER' | 'WORKER' | 'ADMIN') => {
    switchRole(role);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-dialog" style={{ maxWidth: '34rem' }}>
        {/* Header with Hairline Rules */}
        <div className="modal-header">
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>SECURITY PROTOCOL // ACCESS CONTROL</span>
            <h2 id="auth-modal-title" style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>
              Identity Authentication
            </h2>
          </div>
          <button
            type="button"
            className="button button--sm button--outline"
            onClick={onClose}
          >
            DISMISS
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--black)' }}>
          <button
            type="button"
            style={{
              padding: '0.75rem',
              fontWeight: 600,
              fontSize: '0.8rem',
              border: 'none',
              cursor: 'pointer',
              background: tab === 'LOGIN' ? 'var(--black)' : 'var(--white)',
              color: tab === 'LOGIN' ? 'var(--white)' : 'var(--black)',
            }}
            onClick={() => setTab('LOGIN')}
          >
            SIGN IN
          </button>
          <button
            type="button"
            style={{
              padding: '0.75rem',
              fontWeight: 600,
              fontSize: '0.8rem',
              border: 'none',
              borderLeft: '1px solid var(--black)',
              borderRight: '1px solid var(--black)',
              cursor: 'pointer',
              background: tab === 'REG_CUSTOMER' ? 'var(--black)' : 'var(--white)',
              color: tab === 'REG_CUSTOMER' ? 'var(--white)' : 'var(--black)',
            }}
            onClick={() => setTab('REG_CUSTOMER')}
          >
            NEW CUSTOMER
          </button>
          <button
            type="button"
            style={{
              padding: '0.75rem',
              fontWeight: 600,
              fontSize: '0.8rem',
              border: 'none',
              cursor: 'pointer',
              background: tab === 'REG_WORKER' ? 'var(--black)' : 'var(--white)',
              color: tab === 'REG_WORKER' ? 'var(--white)' : 'var(--black)',
            }}
            onClick={() => setTab('REG_WORKER')}
          >
            NEW WORKER
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div style={{ padding: '0.75rem', background: '#FEE2E2', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tab !== 'LOGIN' && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="reg-fullname" className="form-label">Full Legal Name</label>
                  <input
                    id="reg-fullname"
                    type="text"
                    className="input"
                    required
                    placeholder="e.g. Max Miedinger"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="reg-phone" className="form-label">Phone Contact Number</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="input"
                    required
                    placeholder="+41 79 000 0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </>
            )}

            {tab === 'REG_WORKER' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="reg-category" className="form-label">Discipline</label>
                  <select
                    id="reg-category"
                    className="select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-city" className="form-label">Canton</label>
                  <input
                    id="reg-city"
                    type="text"
                    className="input"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="reg-rate" className="form-label">Rate (CHF/h)</label>
                  <input
                    id="reg-rate"
                    type="number"
                    className="input"
                    min="40"
                    max="300"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="auth-email" className="form-label">Electronic Mail Address</label>
              <input
                id="auth-email"
                type="email"
                className="input"
                required
                placeholder="name@domain.ch"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="auth-pwd" className="form-label">Access Passcode</label>
              <input
                id="auth-pwd"
                type="password"
                className="input"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="button"
              style={{ marginTop: '0.5rem', width: '100%' }}
              disabled={loading}
            >
              {loading ? 'VALIDATING...' : tab === 'LOGIN' ? 'AUTHENTICATE CREDENTIALS' : 'SUBMIT REGISTRATION'}
            </button>
          </form>

          {/* Quick Demo Accounts for Hackathon Reviewers */}
          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--rule)' }}>
            <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>EVALUATION SHORTCUTS (1-CLICK TEST LOGIN)</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                className="button button--sm button--outline"
                onClick={() => quickAuth('CUSTOMER')}
              >
                TEST AS CUSTOMER
              </button>
              <button
                type="button"
                className="button button--sm button--outline"
                onClick={() => quickAuth('WORKER')}
              >
                TEST AS WORKER
              </button>
              <button
                type="button"
                className="button button--sm button--outline"
                onClick={() => quickAuth('ADMIN')}
              >
                TEST AS ADMIN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
