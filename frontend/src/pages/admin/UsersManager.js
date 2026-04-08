import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { api } from '../../services/api';
import toast from '../../constants/toast';

const UsersManager = () => {
  const { theme, colors } = useOutletContext() || {};
  const navigate = useNavigate();
  const { isSuperAdmin, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'soccom_admin',
  });

  useEffect(() => {
    if (currentUser && currentUser.role !== ROLES.SUPER_ADMIN) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!isSuperAdmin()) {
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${api.baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error('Error fetching users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const url = editingUser
      ? `${api.baseUrl}/api/users/${editingUser.id}`
      : `${api.baseUrl}/api/users`;
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        fetchUsers();
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save user');
      }
    } catch (error) {
      toast.error('Failed to save user. Please try again.');
    }
  };

  const handleDelete = async userId => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${api.baseUrl}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user. Please try again.');
    }
  };

  const handleEdit = user => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      role: user.role,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', name: '', email: '', role: 'soccom_admin' });
  };

  const openNewUserModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getRoleStyle = role => {
    if (role === 'super_admin')
      return {
        bg: 'rgba(124,58,237,0.1)',
        border: 'rgba(124,58,237,0.2)',
        color: 'rgba(196,181,253,0.9)',
        label: 'Super Admin',
      };
    return {
      bg: 'rgba(42,96,153,0.1)',
      border: 'rgba(42,96,153,0.2)',
      color: 'rgba(147,197,253,0.9)',
      label: 'SocCom Admin',
    };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .um-root { padding: 28px; font-family: 'Inter', sans-serif; color: var(--theme-text); min-height: 100vh; background: var(--theme-bg); }

        .um-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .um-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; margin-bottom: 4px; }
        .um-sub { font-size: 13px; color: var(--theme-text-muted); }

        .um-add-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 8px;
          background: rgba(27,58,107,0.7); border: 1px solid rgba(42,96,153,0.3);
          color: #a8cce8; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.16s;
        }
        .um-add-btn:hover { background: rgba(42,96,153,0.5); }

        .um-loading { color: var(--theme-text-muted); font-size: 13.5px; padding: 32px; text-align: center; }

        .um-panel { background: rgba(255,255,255,0.025); border: 1px solid var(--theme-border); border-radius: 12px; overflow: hidden; }
        .um-table-wrap { overflow-x: auto; }
        table.um-table { width: 100%; border-collapse: collapse; }
        .um-table th {
          padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(168,204,232,0.25); background: rgba(168,204,232,0.03);
          border-bottom: 1px solid rgba(168,204,232,0.05); font-family: 'Cinzel', serif; white-space: nowrap;
        }
        .um-table td { padding: 14px 16px; border-bottom: 1px solid rgba(168,204,232,0.04); font-size: 13px; vertical-align: middle; }
        .um-table tr:last-child td { border-bottom: none; }
        .um-table tr:hover td { background: rgba(168,204,232,0.02); }

        .um-user-name { font-size: 13.5px; font-weight: 500; color: var(--theme-text); }
        .um-username { font-size: 12px; color: var(--theme-text-muted); font-family: monospace; margin-top: 2px; }
        .um-email { font-size: 12.5px; color: var(--theme-text-muted); }
        .um-date { font-size: 12.5px; color: rgba(168,204,232,0.25); }
        .um-no-val { color: rgba(168,204,232,0.2); }

        .um-role-tag {
          display: inline-block; padding: 3px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
        }

        .um-actions { display: flex; justify-content: flex-end; gap: 8px; }
        .um-action-btn { font-size: 12px; font-weight: 500; background: none; border: none; cursor: pointer; padding: 5px 12px; border-radius: 6px; transition: all 0.14s; font-family: 'Inter', sans-serif; }
        .um-action-edit { color: #22c55e !important; }
        .um-action-edit:hover { background: rgba(34,197,94,0.15); color: #22c55e !important; }
        .um-action-del { color: #ef4444 !important; }
        .um-action-del:hover { background: rgba(239,68,68,0.15); color: #ef4444 !important; }

        /* Modal */
        .um-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 24px; backdrop-filter: blur(4px);
        }
        .um-modal {
          background: #12192a; border: 1px solid rgba(168,204,232,0.1);
          border-radius: 16px; width: 100%; max-width: 440px;
          padding: 28px; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        }
        .um-modal-title { font-family: 'Cinzel', serif; font-size: 17px; font-weight: 600; color: var(--theme-text); margin-bottom: 22px; letter-spacing: 0.02em; }
        .um-field { margin-bottom: 16px; }
        .um-label { display: block; font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--theme-text-muted); margin-bottom: 7px; }
        .um-label-hint { font-size: 10.5px; color: rgba(168,204,232,0.2); margin-left: 6px; font-weight: 400; text-transform: none; letter-spacing: 0; }
        .um-input {
          width: 100%; background: rgba(168,204,232,0.05); border: 1px solid rgba(168,204,232,0.1);
          border-radius: 8px; padding: 11px 14px; font-size: 13.5px; color: var(--theme-text); outline: none;
          font-family: 'Inter', sans-serif; transition: border-color 0.18s, box-shadow 0.18s;
        }
        .um-input::placeholder { color: rgba(168,204,232,0.2); }
        .um-input:focus { border-color: rgba(42,96,153,0.5); box-shadow: 0 0 0 3px rgba(42,96,153,0.1); }
        .um-modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
        .um-modal-btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .um-modal-btn-cancel { background: var(--theme-border); border: 1px solid rgba(168,204,232,0.1); color: var(--theme-text-muted); }
        .um-modal-btn-cancel:hover { background: rgba(168,204,232,0.1); color: rgba(168,204,232,0.8); }
        .um-modal-btn-primary { background: rgba(27,58,107,0.7); border: 1px solid rgba(42,96,153,0.3); color: #a8cce8; }
        .um-modal-btn-primary:hover { background: rgba(42,96,153,0.5); }
      `}</style>

      <div className="um-root">
        <div className="um-header">
          <div>
            <div className="um-title">User Management</div>
            <div className="um-sub">Manage admin users and permissions</div>
          </div>
          <button onClick={openNewUserModal} className="um-add-btn">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New User
          </button>
        </div>

        {loading ? (
          <div className="um-loading">Loading users...</div>
        ) : (
          <div className="um-panel">
            <div className="um-table-wrap">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const rs = getRoleStyle(user.role);
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="um-user-name">{user.name}</div>
                          <div className="um-username">@{user.username}</div>
                        </td>
                        <td>
                          {user.email ? (
                            <span className="um-email">{user.email}</span>
                          ) : (
                            <span className="um-no-val">—</span>
                          )}
                        </td>
                        <td>
                          <span
                            className="um-role-tag"
                            style={{
                              background: rs.bg,
                              border: `1px solid ${rs.border}`,
                              color: rs.color,
                            }}
                          >
                            {rs.label}
                          </span>
                        </td>
                        <td>
                          <span className="um-date">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <div className="um-actions">
                            <button
                              onClick={() => handleEdit(user)}
                              className="um-action-btn um-action-edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="um-action-btn um-action-del"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showModal && (
          <div className="um-modal-overlay">
            <div className="um-modal">
              <div className="um-modal-title">{editingUser ? 'Edit User' : 'Add New User'}</div>
              <form onSubmit={handleSubmit}>
                <div className="um-field">
                  <label className="um-label">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="um-input"
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="um-field">
                  <label className="um-label">
                    Password
                    {editingUser && (
                      <span className="um-label-hint">(leave blank to keep current)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="um-input"
                    placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                    required={!editingUser}
                  />
                </div>
                <div className="um-field">
                  <label className="um-label">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="um-input"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="um-field">
                  <label className="um-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="um-input"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="um-field">
                  <label className="um-label">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="um-input"
                  >
                    <option value="soccom_admin">SocCom Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="um-modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="um-modal-btn um-modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="um-modal-btn um-modal-btn-primary">
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UsersManager;
