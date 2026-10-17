import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, reportsData, usersData] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/reports'),
        apiFetch('/api/admin/users'),
      ]);
      setStats(statsData);
      setReports(reportsData);
      setUsersList(usersData);
    } catch (err) {
      toast.error(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin' && user.username?.toLowerCase() !== 'admin') {
      toast.error('Access denied: Admin privileges required.');
      navigate('/');
      return;
    }
    loadAdminData();
  }, [user, navigate, toast, loadAdminData]);


  const handleToggleVerifyUser = async (userId) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/verify`, { method: 'PATCH' });
      toast.success(res.message);
      loadAdminData();
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNotes: `Marked ${status} by admin @${user.username}` }),
      });
      toast.success(`Report marked as ${status}`);
      loadAdminData();
    } catch (err) {
      toast.error(err.message || 'Failed to update report');
    }
  };

  const handleDeleteReportedItem = async (type, id, reportId) => {
    if (!window.confirm(`Are you sure you want to remove this flagged ${type}?`)) return;
    try {
      await apiFetch(`/api/admin/items/${type}/${id}`, { method: 'DELETE' });
      await apiFetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'actioned', adminNotes: 'Item removed from marketplace' }),
      });
      toast.success(`Flagged ${type} removed and report actioned.`);
      loadAdminData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <LoadingSkeleton count={4} type="card" />
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Campus Moderation & Admin Control</h1>
        <p className="admin-subtitle">
          Manage PICT student accounts, verify college credentials, and action student safety reports.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-cards-grid">
          <div className="stat-card">
            <span className="stat-num">{stats.users}</span>
            <span className="stat-label">Students Registered</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.products}</span>
            <span className="stat-label">Marketplace Items</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.rentals}</span>
            <span className="stat-label">Rentals Active</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.orders}</span>
            <span className="stat-label">Orders Completed</span>
          </div>
          <div className="stat-card">
            <span className="stat-num" style={{ color: stats.pendingReports > 0 ? '#ef4444' : '#10b981' }}>
              {stats.pendingReports}
            </span>
            <span className="stat-label">Pending Reports</span>
          </div>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Reports ({reports.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Student Accounts ({usersList.length})
        </button>
      </div>

      {/* Tab Content: Reports */}
      {activeTab === 'overview' && (
        <div>
          <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Student Reports & Flagged Listings</h3>
          {reports.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px' }}>
              🎉 No reports currently filed. The campus marketplace is running cleanly!
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reported By</th>
                    <th>Target Type</th>
                    <th>Reason</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep) => (
                    <tr key={rep._id}>
                      <td>{new Date(rep.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>@{rep.reporterUsername}</td>
                      <td>
                        <strong>{rep.targetType}</strong>
                        {rep.targetTitle && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{rep.targetTitle}</div>}
                      </td>
                      <td style={{ fontWeight: 600, color: '#dc2626' }}>{rep.reason}</td>
                      <td style={{ maxWidth: '200px' }}>{rep.details || '—'}</td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: rep.status === 'pending' ? '#fef3c7' : '#e0f2fe',
                            color: rep.status === 'pending' ? '#b45309' : '#0369a1',
                          }}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {rep.status === 'pending' && (
                            <>
                              <button
                                className="admin-action-btn verify"
                                onClick={() => handleUpdateReport(rep._id, 'dismissed')}
                              >
                                Dismiss
                              </button>
                              <button
                                className="admin-action-btn danger"
                                onClick={() =>
                                  handleDeleteReportedItem(rep.targetType, rep.targetId, rep._id)
                                }
                              >
                                Delete Item
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div>
          <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Registered Campus Students</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Verified Student</th>
                  <th>Avg Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong>@{u.username}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.department || 'PICT'}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: u.role === 'admin' ? '#7c3aed' : '#475569',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.isVerified ? (
                        <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Verified</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Unverified</span>
                      )}
                    </td>
                    <td>⭐ {u.ratingsAverage || 5.0} ({u.ratingsCount || 0})</td>
                    <td>
                      <button
                        className={`admin-action-btn ${u.isVerified ? 'danger' : 'verify'}`}
                        onClick={() => handleToggleVerifyUser(u._id)}
                      >
                        {u.isVerified ? 'Revoke Verification' : 'Verify Student'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
