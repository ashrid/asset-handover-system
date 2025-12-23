import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/Skeleton';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for new user
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { authFetch, user: currentUser } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchAvailableEmployees();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authFetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        addToast('error', data.error?.message || 'Failed to load users');
      }
    } catch (err) {
      addToast('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEmployees = async () => {
    try {
      const response = await authFetch('/api/users/available/employees');
      const data = await response.json();
      if (data.success) {
        setAvailableEmployees(data.employees);
      }
    } catch (err) {
      console.error('Failed to load available employees:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await authFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: parseInt(selectedEmployeeId),
          role: selectedRole
        })
      });

      const data = await response.json();
      if (data.success) {
        addToast('success', 'User created successfully');
        setShowCreateModal(false);
        setSelectedEmployeeId('');
        setSelectedRole('viewer');
        fetchUsers();
        fetchAvailableEmployees();
      } else {
        addToast('error', data.error?.message || 'Failed to create user');
      }
    } catch (err) {
      addToast('error', 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const response = await authFetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();
      if (data.success) {
        addToast('success', 'User role updated');
        setEditingUserId(null);
        fetchUsers();
      } else {
        addToast('error', data.error?.message || 'Failed to update user');
      }
    } catch (err) {
      addToast('error', 'Failed to update user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      let response;
      if (currentStatus) {
        // Deactivate
        response = await authFetch(`/api/users/${userId}`, {
          method: 'DELETE'
        });
      } else {
        // Reactivate
        response = await authFetch(`/api/users/${userId}/reactivate`, {
          method: 'PUT'
        });
      }

      const data = await response.json();
      if (data.success) {
        addToast('success', `User ${action}d successfully`);
        fetchUsers();
        fetchAvailableEmployees();
      } else {
        addToast('error', data.error?.message || `Failed to ${action} user`);
      }
    } catch (err) {
      addToast('error', `Failed to ${action} user`);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.employeeName?.toLowerCase().includes(search) ||
      user.employeeId?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <Skeleton variant="title" width="200px" />
          <Skeleton variant="button" />
        </div>
        <div className="premium-card p-6">
          <Skeleton variant="table-row" count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Header */}
      <div className="premium-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold gradient-text">
              User Management
            </h2>
            <p className="text-sm mt-1 text-text-secondary">
              Manage system users and their roles
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-premium flex items-center gap-2"
            disabled={availableEmployees.length === 0}
          >
            <i className="fas fa-user-plus"></i>
            Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="premium-card p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, ID, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium pl-10"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-light"></i>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="premium-card p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {users.length}
          </div>
          <div className="text-sm text-text-secondary">
            Total Users
          </div>
        </div>
        <div className="premium-card p-4 text-center">
          <div className="text-2xl font-bold text-danger">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-sm text-text-secondary">
            Admins
          </div>
        </div>
        <div className="premium-card p-4 text-center">
          <div className="text-2xl font-bold text-info">
            {users.filter(u => u.role === 'staff').length}
          </div>
          <div className="text-sm text-text-secondary">
            Staff
          </div>
        </div>
        <div className="premium-card p-4 text-center">
          <div className="text-2xl font-bold text-success">
            {users.filter(u => u.isActive).length}
          </div>
          <div className="text-sm text-text-secondary">
            Active
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th className="hidden md:table-cell">Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Last Login</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                  <td>
                    <div className="font-medium text-text-primary">{user.employeeName}</div>
                    {user.officeCollege && (
                      <div className="text-xs text-text-secondary">{user.officeCollege}</div>
                    )}
                  </td>
                  <td className="text-text-secondary">{user.employeeId}</td>
                  <td className="hidden md:table-cell text-text-secondary">{user.email}</td>
                  <td>
                    {editingUserId === user.id ? (
                      <select
                        defaultValue={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        onBlur={() => setEditingUserId(null)}
                        className="input-premium text-sm py-1"
                        autoFocus
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`badge-premium ${
                        user.role === 'admin' ? 'badge-danger' :
                        user.role === 'staff' ? 'badge-info' : 'badge-secondary'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge-premium ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell text-sm text-text-secondary">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.id !== currentUser.id && (
                        <>
                          <button
                            onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                            className="btn-icon text-primary"
                            title="Edit role"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                            className={`btn-icon ${user.isActive ? 'text-danger' : 'text-success'}`}
                            title={user.isActive ? 'Deactivate user' : 'Reactivate user'}
                          >
                            <i className={`fas ${user.isActive ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                          </button>
                        </>
                      )}
                      {user.id === currentUser.id && (
                        <span className="badge-premium badge-secondary">You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-text-secondary">
                    {searchTerm ? 'No users match your search' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => !isSubmitting && setShowCreateModal(false)}>
          <div className="modal-content animate-scaleIn" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h2 style={{ margin: 0, fontSize: '20px' }}>Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-icon text-text-secondary"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="card-body">
              {availableEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-users text-4xl mb-4 text-text-light"></i>
                  <p className="text-text-secondary">
                    All employees already have user accounts
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateUser}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2 text-text-primary">
                      Select Employee <span className="text-danger">*</span>
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      required
                      className="input-premium"
                    >
                      <option value="">Choose an employee...</option>
                      {availableEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeName} ({emp.employeeId}) - {emp.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2 text-text-primary">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      required
                      className="input-premium"
                    >
                      <option value="viewer">Viewer (Read-only access)</option>
                      <option value="staff">Staff (Manage assets &amp; assignments)</option>
                      <option value="admin">Admin (Full access including user management)</option>
                    </select>
                    <p className="mt-1 text-xs text-text-secondary">
                      {selectedRole === 'admin' && 'Admins can manage users, assets, and all assignments'}
                      {selectedRole === 'staff' && 'Staff can manage assets and create/edit assignments'}
                      {selectedRole === 'viewer' && 'Viewers can only view dashboard and assignments'}
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="btn-secondary"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-premium flex items-center gap-2"
                      disabled={isSubmitting || !selectedEmployeeId}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus"></i>
                          Create User
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
