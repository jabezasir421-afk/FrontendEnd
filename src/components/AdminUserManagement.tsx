import React, { useState } from 'react';
import { AdminUserItem, UserRole } from '../types';

interface AdminUserManagementProps {
  users: AdminUserItem[];
  onToggleStatus: (userId: string, newStatus: 'ACTIVE' | 'DEACTIVATED') => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ users, onToggleStatus }) => {
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--black)', paddingBottom: '1rem' }}>
        <div>
          <span className="eyebrow" style={{ margin: 0 }}>
            ACCESS CONTROL & ROLE ASSIGNMENT // DIRECTORY 04
          </span>
          <h2 style={{ marginTop: '0.25rem' }}>
            Registered Platform Accounts
          </h2>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Total Accounts: <strong className="mono-num" style={{ color: 'var(--black)' }}>{users.length}</strong>
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem', background: 'var(--gray)', padding: '1rem', border: '1px solid var(--rule)' }}>
        <div style={{ gridColumn: 'span 8' }}>
          <label htmlFor="user-search" className="form-label">Search Identifier / Email</label>
          <input
            id="user-search"
            type="text"
            className="input"
            placeholder="Search by legal name or electronic mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ gridColumn: 'span 4' }}>
          <label htmlFor="user-role-filter" className="form-label">Role Classification</label>
          <select
            id="user-role-filter"
            className="select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="WORKER">Trade Workers</option>
            <option value="ADMIN">Administrators</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <table className="swiss-table" aria-label="User Accounts Ledger">
        <thead>
          <tr>
            <th>User Account</th>
            <th>Role</th>
            <th>Contact Telephony</th>
            <th>Registered Date</th>
            <th style={{ textAlign: 'right' }}>Total Volume</th>
            <th>Account Status</th>
            <th style={{ textAlign: 'right' }}>Authority Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
              </td>
              <td>
                <span className={`badge ${u.role === 'ADMIN' ? 'badge--dark' : u.role === 'WORKER' ? '' : 'badge--gray'}`}>
                  {u.role}
                </span>
              </td>
              <td className="mono-num" style={{ fontSize: '0.85rem' }}>
                {u.phoneNumber || '—'}
              </td>
              <td className="mono-num" style={{ fontSize: '0.85rem' }}>
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="mono-num" style={{ textAlign: 'right' }}>
                {u.totalBookings} orders
              </td>
              <td>
                {u.status === 'ACTIVE' ? (
                  <span className="badge" style={{ borderColor: '#16A34A', color: '#16A34A' }}>
                    ACTIVE
                  </span>
                ) : (
                  <span className="badge badge--red">
                    DEACTIVATED
                  </span>
                )}
              </td>
              <td style={{ textAlign: 'right' }}>
                {u.role !== 'ADMIN' && (
                  <button
                    type="button"
                    className={`button button--sm ${u.status === 'ACTIVE' ? 'button--outline' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => onToggleStatus(u.id, u.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE')}
                  >
                    {u.status === 'ACTIVE' ? 'SUSPEND' : 'RESTORE'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
