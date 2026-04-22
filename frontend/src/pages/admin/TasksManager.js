import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from '../../constants/toast';
import { useOutletContext } from 'react-router-dom';

const STATUS_OPTIONS = [
  { value: 'pending',      label: 'Pending',      color: '#f6e05e' },
  { value: 'in_progress',  label: 'In Progress',  color: '#60a5fa' },
  { value: 'implemented',  label: 'Implemented',  color: '#a78bfa' },
  { value: 'completed',    label: 'Completed',    color: '#4ade80' },
  { value: 'rejected',     label: 'Reject…',      color: '#f87171' },
];

const STATUS_LABELS = {
  pending:     'Pending',
  in_progress: 'In Progress',
  implemented: 'Implemented',
  completed:   'Completed',
  rejected:    'Rejected',
};

const TasksManager = () => {
  const { theme, colors } = useOutletContext() || {};
  const {
    tasks,
    getMyTasks,
    createTask,
    updateTask,
    deleteTask,
    currentUser,
    getAllUsers,
    loadUsers,
  } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Reassign modal state
  const [reassignTarget, setReassignTarget] = useState(null);
  const [reassignUserId, setReassignUserId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assigneeId: '',
    assigneeName: '',
  });

  useEffect(() => {
    // Only super_admin is allowed to call GET /api/users
    if (currentUser?.role === 'super_admin') {
      loadUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  const allUsers = getAllUsers() || [];
  const myTasks = getMyTasks();
  const visibleTasks = currentUser?.role === 'super_admin' ? tasks : myTasks;

  const getFilteredTasks = () => {
    if (filter === 'all') return visibleTasks;
    return visibleTasks.filter(t => t.status === filter);
  };

  const displayTasks = getFilteredTasks();

  // Stats always from full visible set (not filtered)
  const pendingCount     = visibleTasks.filter(t => t.status === 'pending').length;
  const inProgressCount  = visibleTasks.filter(t => t.status === 'in_progress').length;
  const implementedCount = visibleTasks.filter(t => t.status === 'implemented').length;
  const completedCount   = visibleTasks.filter(t => t.status === 'completed').length;
  const rejectedCount    = visibleTasks.filter(t => t.status === 'rejected').length;

  const handleCreateTask = async e => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const selectedUser = allUsers.find(u => u.id === parseInt(taskForm.assigneeId));
      await createTask({
        ...taskForm,
        assigneeId: taskForm.assigneeId || currentUser.id,
        assigneeName: selectedUser ? selectedUser.name : currentUser.name,
      });
      setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', assigneeId: '', assigneeName: '' });
      setShowCreateModal(false);
      toast.success('Task created.');
    } catch (error) {
      toast.error('Failed to create task: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    if (newStatus === task.status) return;
    if (newStatus === 'rejected') {
      // Open reject modal instead of updating immediately
      setRejectTarget(task);
      setRejectReason('');
      return;
    }
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    }
  };

  const handleSubmitRejection = async e => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.warning('Please provide a reason for rejection.');
      return;
    }
    setRejecting(true);
    try {
      await updateTask(rejectTarget.id, { status: 'rejected', rejectionReason: rejectReason.trim() });
      toast.success('Task rejected. The creator has been notified.');
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to reject task: ' + err.message);
    } finally {
      setRejecting(false);
    }
  };

  const handleSubmitReassign = async e => {
    e.preventDefault();
    if (!reassignUserId) {
      toast.warning('Please select a team member.');
      return;
    }
    setReassigning(true);
    try {
      const newAssignee = allUsers.find(u => u.id === parseInt(reassignUserId));
      await updateTask(reassignTarget.id, {
        assigneeId:   parseInt(reassignUserId),
        assigneeName: newAssignee ? newAssignee.name : '',
        // status reset to 'pending' is handled server-side on assignee change
      });
      toast.success(`Task reassigned to ${newAssignee?.name || 'new member'}.`);
      setReassignTarget(null);
      setReassignUserId('');
    } catch (err) {
      toast.error('Failed to reassign: ' + err.message);
    } finally {
      setReassigning(false);
    }
  };

  const handleDelete = async taskId => {
    if (window.confirm('Delete this task? This cannot be undone.')) {
      await deleteTask(taskId);
    }
  };

  const getPriorityStyle = priority => {
    const map = {
      high:   { bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.2)',   color: '#f87171' },
      medium: { bg: 'rgba(201,168,76,0.1)',   border: 'rgba(201,168,76,0.2)',  color: '#fbbf24' },
      low:    { bg: 'rgba(22,163,74,0.1)',    border: 'rgba(22,163,74,0.2)',   color: '#4ade80' },
    };
    return map[priority] || map.medium;
  };

  const getStatusStyle = status => {
    const map = {
      pending:     { bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.25)',  color: '#f6e05e' },
      in_progress: { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',   color: '#60a5fa' },
      implemented: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)',  color: '#a78bfa' },
      completed:   { bg: 'rgba(22,163,74,0.12)',   border: 'rgba(22,163,74,0.3)',    color: '#4ade80' },
      rejected:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',    color: '#f87171' },
    };
    return map[status] || map.pending;
  };

  const tabs = [
    { key: 'all',         label: 'All',         count: visibleTasks.length,  color: '#a8cce8',            bg: 'rgba(42,96,153,0.18)' },
    { key: 'pending',     label: 'Pending',      count: pendingCount,         color: '#f6e05e',            bg: 'rgba(201,168,76,0.15)' },
    { key: 'in_progress', label: 'In Progress',  count: inProgressCount,      color: '#60a5fa',            bg: 'rgba(59,130,246,0.15)' },
    { key: 'implemented', label: 'Implemented',  count: implementedCount,     color: '#a78bfa',            bg: 'rgba(167,139,250,0.15)' },
    { key: 'completed',   label: 'Completed',    count: completedCount,       color: '#4ade80',            bg: 'rgba(22,163,74,0.15)' },
    { key: 'rejected',    label: 'Rejected',     count: rejectedCount,        color: '#f87171',            bg: 'rgba(239,68,68,0.15)' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .tm-root { padding: 28px; font-family: 'Inter', sans-serif; color: var(--theme-text); min-height: 100vh; background: var(--theme-bg); }

        .tm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .tm-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; margin-bottom: 4px; }
        .tm-sub { font-size: 13px; color: var(--theme-text-muted); }

        .tm-new-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 8px;
          background: rgba(27,58,107,0.7); border: 1px solid rgba(42,96,153,0.3);
          color: #a8cce8; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.16s;
        }
        .tm-new-btn:hover { background: rgba(42,96,153,0.5); }

        .tm-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 22px; }
        @media (max-width: 900px) { .tm-stats { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .tm-stats { grid-template-columns: repeat(2, 1fr); } }
        .tm-stat { background: rgba(255,255,255,0.025); border: 1px solid var(--theme-border); border-radius: 12px; padding: 16px 18px; }
        .tm-stat-val { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; margin-bottom: 5px; }
        .tm-stat-label { font-size: 11.5px; color: rgba(168,204,232,0.35); }

        .tm-panel { background: rgba(255,255,255,0.025); border: 1px solid var(--theme-border); border-radius: 12px; overflow: hidden; }
        .tm-toolbar { display: flex; gap: 6px; padding: 14px 16px; border-bottom: 1px solid var(--theme-border); flex-wrap: wrap; }
        .tm-tab {
          padding: 6px 13px; border-radius: 7px; font-size: 12px; font-weight: 500;
          border: 1px solid transparent; cursor: pointer; background: none;
          font-family: 'Inter', sans-serif; color: var(--theme-text-muted); transition: all 0.14s;
        }
        .tm-tab:hover { background: var(--theme-border); color: rgba(168,204,232,0.7); }

        .tm-list { }
        .tm-item {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 18px; border-bottom: 1px solid rgba(168,204,232,0.05);
          transition: background 0.14s;
        }
        .tm-item:last-child { border-bottom: none; }
        .tm-item:hover { background: rgba(168,204,232,0.02); }

        /* Status dropdown */
        .tm-status-select {
          flex-shrink: 0;
          appearance: none; -webkit-appearance: none;
          padding: 5px 26px 5px 10px; border-radius: 7px;
          font-size: 11.5px; font-weight: 600; font-family: 'Inter', sans-serif;
          cursor: pointer; outline: none; transition: all 0.15s;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a8cce8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 7px center;
          min-width: 118px;
        }
        .tm-status-select:hover { filter: brightness(1.15); }

        .tm-content { flex: 1; min-width: 0; }
        .tm-item-top { display: flex; align-items: center; gap: 9px; margin-bottom: 5px; flex-wrap: wrap; }
        .tm-item-title { font-size: 13.5px; font-weight: 500; color: var(--theme-text); }
        .tm-item-title.done { text-decoration: line-through; color: rgba(168,204,232,0.3); }

        .tm-priority {
          display: inline-block; padding: 2px 9px; border-radius: 5px;
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em; text-transform: capitalize;
        }
        .tm-item-desc { font-size: 12.5px; color: var(--theme-text-muted); margin-bottom: 8px; line-height: 1.5; }
        .tm-item-meta { display: flex; gap: 16px; font-size: 11.5px; color: rgba(168,204,232,0.25); flex-wrap: wrap; }

        .tm-rejection-note {
          margin-top: 7px; padding: 8px 12px; border-radius: 7px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          font-size: 12px; color: #f87171; line-height: 1.5;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
        }
        .tm-rejection-note strong { font-weight: 600; }
        .tm-reassign-btn {
          flex-shrink: 0; padding: 4px 11px; border-radius: 6px; font-size: 11.5px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.14s; white-space: nowrap;
          background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.3); color: #60a5fa;
        }
        .tm-reassign-btn:hover { background: rgba(96,165,250,0.25); }

        .tm-delete {
          flex-shrink: 0; background: none; border: none; cursor: pointer;
          color: rgba(168,204,232,0.2); padding: 4px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.14s, color 0.14s; margin-top: 2px;
        }
        .tm-delete:hover { background: rgba(220,38,38,0.1); color: #f87171; }

        .tm-empty { padding: 48px 24px; text-align: center; color: rgba(168,204,232,0.2); font-size: 13.5px; }

        /* Modals */
        .tm-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.72);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 24px; backdrop-filter: blur(4px);
        }
        .tm-modal {
          background: var(--theme-bg, #12192a); border: 1px solid var(--theme-border, rgba(168,204,232,0.1));
          border-radius: 16px; width: 100%; max-width: 460px;
          padding: 28px; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 24px 80px rgba(0,0,0,0.55);
        }
        .tm-modal-reject { border-color: rgba(239,68,68,0.25); }
        .tm-modal-title { font-family: 'Cinzel', serif; font-size: 17px; font-weight: 600; color: var(--theme-text); margin-bottom: 8px; letter-spacing: 0.02em; }
        .tm-modal-sub { font-size: 13px; color: var(--theme-text-muted); margin-bottom: 22px; line-height: 1.5; }
        .tm-field { margin-bottom: 16px; }
        .tm-label { display: block; font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--theme-text-muted); margin-bottom: 7px; }
        .tm-input {
          width: 100%; background: rgba(168,204,232,0.05); border: 1px solid rgba(168,204,232,0.1);
          border-radius: 8px; padding: 11px 14px; font-size: 13.5px; color: var(--theme-text); outline: none;
          font-family: 'Inter', sans-serif; transition: border-color 0.18s, box-shadow 0.18s;
        }
        .tm-input::placeholder { color: rgba(168,204,232,0.2); }
        .tm-input:focus { border-color: rgba(42,96,153,0.5); box-shadow: 0 0 0 3px rgba(42,96,153,0.1); }
        .tm-input-reject:focus { border-color: rgba(239,68,68,0.4); box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
        .tm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tm-modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
        .tm-modal-btn {
          padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
          cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .tm-modal-btn:disabled { opacity: 0.55; cursor: default; }
        .tm-btn-cancel  { background: rgba(168,204,232,0.08); border: 1px solid rgba(168,204,232,0.12); color: var(--theme-text-muted); }
        .tm-btn-cancel:hover  { background: rgba(168,204,232,0.13); color: rgba(168,204,232,0.8); }
        .tm-btn-primary { background: rgba(27,58,107,0.7); border: 1px solid rgba(42,96,153,0.3); color: #a8cce8; }
        .tm-btn-primary:hover { background: rgba(42,96,153,0.5); }
        .tm-btn-danger  { background: rgba(220,38,38,0.15); border: 1px solid rgba(220,38,38,0.3); color: #f87171; }
        .tm-btn-danger:hover { background: rgba(220,38,38,0.25); }
      `}</style>

      <div className="tm-root">
        <div className="tm-header">
          <div>
            <div className="tm-title">Task Management</div>
            <div className="tm-sub">Manage and track task assignments</div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="tm-new-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Task
          </button>
        </div>

        {/* Stats */}
        <div className="tm-stats">
          <div className="tm-stat">
            <div className="tm-stat-val" style={{ color: 'var(--theme-text)' }}>{visibleTasks.length}</div>
            <div className="tm-stat-label">Total</div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-val" style={{ color: '#f6e05e' }}>{pendingCount}</div>
            <div className="tm-stat-label">Pending</div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-val" style={{ color: '#60a5fa' }}>{inProgressCount}</div>
            <div className="tm-stat-label">In Progress</div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-val" style={{ color: '#a78bfa' }}>{implementedCount}</div>
            <div className="tm-stat-label">Implemented</div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-val" style={{ color: '#4ade80' }}>{completedCount}</div>
            <div className="tm-stat-label">Completed</div>
          </div>
        </div>

        {/* Task list */}
        <div className="tm-panel">
          <div className="tm-toolbar">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className="tm-tab"
                style={filter === t.key ? { background: t.bg, color: t.color, borderColor: `${t.color}44` } : {}}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          <div className="tm-list">
            {visibleTasks.length === 0 ? (
              <div className="tm-empty">No tasks yet. Create your first task.</div>
            ) : displayTasks.length === 0 ? (
              <div className="tm-empty">No tasks match this filter.</div>
            ) : (
              displayTasks.map(task => {
                const ps = getPriorityStyle(task.priority);
                const ss = getStatusStyle(task.status);
                const isDone = task.status === 'completed';
                const isRejected = task.status === 'rejected';
                const isCreator = task.created_by === currentUser?.id;

                return (
                  <div className="tm-item" key={task.id}>
                    {/* Status dropdown */}
                    <select
                      className="tm-status-select"
                      value={task.status}
                      onChange={e => handleStatusChange(task, e.target.value)}
                      style={{
                        background: ss.bg,
                        border: `1px solid ${ss.border}`,
                        color: ss.color,
                      }}
                      title="Change task status"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <div className="tm-content">
                      <div className="tm-item-top">
                        <span className={`tm-item-title${isDone ? ' done' : ''}`}>{task.title}</span>
                        <span
                          className="tm-priority"
                          style={{ background: ps.bg, border: `1px solid ${ps.border}`, color: ps.color }}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {task.description && <div className="tm-item-desc">{task.description}</div>}

                      {/* Rejection banner — shown to everyone; Reassign only to creator */}
                      {isRejected && (
                        <div className="tm-rejection-note">
                          <span>
                            <strong>Rejected{task.rejected_by ? ` by ${task.rejected_by}` : ''}:</strong>{' '}
                            {task.rejection_reason || 'No reason provided.'}
                          </span>
                          {isCreator && (
                            <button
                              className="tm-reassign-btn"
                              onClick={() => { setReassignTarget(task); setReassignUserId(''); }}
                            >
                              ↺ Reassign
                            </button>
                          )}
                        </div>
                      )}

                      <div className="tm-item-meta">
                        {task.created_at && <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>}
                        {task.due_date   && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                        {task.created_by_name && <span>By: {task.created_by_name}</span>}
                        {task.assignee_name   && <span>Assigned to: {task.assignee_name}</span>}
                      </div>
                    </div>

                    <button onClick={() => handleDelete(task.id)} className="tm-delete" title="Delete task">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
                        <path d="M10,11v6" /><path d="M14,11v6" />
                        <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Create Task Modal ── */}
      {showCreateModal && (
        <div className="tm-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="tm-modal" onClick={e => e.stopPropagation()}>
            <div className="tm-modal-title">Create New Task</div>
            <form onSubmit={handleCreateTask}>
              <div className="tm-field">
                <label className="tm-label">Task Title <span style={{ color: '#f87171' }}>*</span></label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="tm-input"
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="tm-field">
                <label className="tm-label">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                  className="tm-input"
                  placeholder="Describe the task..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="tm-field">
                <label className="tm-label">Assign To</label>
                <select
                  value={taskForm.assigneeId}
                  onChange={e => {
                    const user = allUsers.find(u => u.id === parseInt(e.target.value));
                    setTaskForm({ ...taskForm, assigneeId: e.target.value, assigneeName: user ? user.name : '' });
                  }}
                  className="tm-input"
                >
                  <option value="">Select team member…</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>
              <div className="tm-grid-2">
                <div className="tm-field">
                  <label className="tm-label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="tm-input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="tm-field">
                  <label className="tm-label">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="tm-input"
                  />
                </div>
              </div>
              <div className="tm-modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="tm-modal-btn tm-btn-cancel">Cancel</button>
                <button type="submit" className="tm-modal-btn tm-btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reassign Task Modal ── */}
      {reassignTarget && (
        <div className="tm-modal-overlay" onClick={() => setReassignTarget(null)}>
          <div className="tm-modal" onClick={e => e.stopPropagation()}>
            <div className="tm-modal-title">Reassign Task</div>
            <div className="tm-modal-sub">
              <strong style={{ color: 'var(--theme-text)' }}>"{reassignTarget.title}"</strong> was rejected
              {reassignTarget.rejected_by ? ` by ${reassignTarget.rejected_by}` : ''}.
              Select a new team member to take over. The task will reset to <em>Pending</em> and they will be notified.
            </div>
            <form onSubmit={handleSubmitReassign}>
              <div className="tm-field">
                <label className="tm-label">Assign To <span style={{ color: '#f87171' }}>*</span></label>
                <select
                  value={reassignUserId}
                  onChange={e => setReassignUserId(e.target.value)}
                  className="tm-input"
                  required
                  autoFocus
                >
                  <option value="">Select team member…</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role}){user.id === reassignTarget.assignee_id ? ' — current' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="tm-modal-footer">
                <button type="button" onClick={() => setReassignTarget(null)} className="tm-modal-btn tm-btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="tm-modal-btn tm-btn-primary" disabled={reassigning}>
                  {reassigning ? 'Reassigning…' : 'Reassign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reject Task Modal ── */}
      {rejectTarget && (
        <div className="tm-modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="tm-modal tm-modal-reject" onClick={e => e.stopPropagation()}>
            <div className="tm-modal-title" style={{ color: '#f87171' }}>Reject Task</div>
            <div className="tm-modal-sub">
              You are rejecting <strong style={{ color: 'var(--theme-text)' }}>"{rejectTarget.title}"</strong>.
              The task creator will receive a notification with your reason.
            </div>
            <form onSubmit={handleSubmitRejection}>
              <div className="tm-field">
                <label className="tm-label">Reason for Rejection <span style={{ color: '#f87171' }}>*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={4}
                  className="tm-input tm-input-reject"
                  placeholder="Explain why this task is being rejected…"
                  style={{ resize: 'vertical' }}
                  autoFocus
                  required
                />
              </div>
              <div className="tm-modal-footer">
                <button type="button" onClick={() => setRejectTarget(null)} className="tm-modal-btn tm-btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="tm-modal-btn tm-btn-danger" disabled={rejecting}>
                  {rejecting ? 'Rejecting…' : 'Submit Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TasksManager;
