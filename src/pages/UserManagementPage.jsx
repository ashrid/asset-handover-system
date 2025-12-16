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

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="page-container">
        <div className="flex justify-between items-center mb-6">
          <Skeleton variant="title" width="200px" />
          <Skeleton variant="button" />
        </div>
        <div className="card">
          <Skeleton variant="table-row" count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            User Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Manage system users and their roles
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
          disabled={availableEmployees.length === 0}
        >
          <i className="fas fa-user-plus"></i>
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, ID, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-10"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--theme-primary)' }}>
            {users.length}
          </div>
          <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            Total Users
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            Admins
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'staff').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            Staff
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isActive).length}
          </div>
          <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            Active
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: 'var(--theme-surface-elevated)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                  Employee ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell" style={{ color: 'var(--theme-text-secondary)' }}>
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell" style={{ color: 'var(--theme-text-secondary)' }}>
                  Last Login
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-opacity-50 ${!user.isActive ? 'opacity-50' : ''}`}
                  style={{ backgroundColor: !user.isActive ? 'var(--theme-surface-elevated)' : 'transparent' }}
                >
                  <td className="px-4 py-3" style={{ color: 'var(--theme-text-primary)' }}>
                    <div className="font-medium">{user.employeeName}</div>
                    {user.officeCollege && (
                      <div className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                        {user.officeCollege}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--theme-text-secondary)' }}>
                    {user.employeeId}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--theme-text-secondary)' }}>
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    {editingUserId === user.id ? (
                      <select
                        defaultValue={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        onBlur={() => setEditingUserId(null)}
                        className="input-field text-sm py-1"
                        autoFocus
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.id !== currentUser.id && (
                        <>
                          <button
                            onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Edit role"
                            style={{ color: 'var(--theme-primary)' }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={user.isActive ? 'Deactivate user' : 'Reactivate user'}
                            style={{ color: user.isActive ? '#ef4444' : '#22c55e' }}
                          >
                            <i className={`fas ${user.isActive ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                          </button>
                        </>
                      )}
                      {user.id === currentUser.id && (
                        <span className="text-xs px-2 py-1 rounded" style={{ color: 'var(--theme-text-secondary)', background: 'var(--theme-surface-elevated)' }}>
                          You
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center" style={{ color: 'var(--theme-text-secondary)' }}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Create New User
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {availableEmployees.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-users text-4xl mb-4" style={{ color: 'var(--theme-text-secondary)' }}></i>
                <p style={{ color: 'var(--theme-text-secondary)' }}>
                  All employees already have user accounts
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                    Select Employee
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    required
                    className="input-field w-full"
                  >
                    <option value="">Choose an employee...</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeName} ({emp.employeeId}) - {emp.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                    className="input-field w-full"
                  >
                    <option value="viewer">Viewer (Read-only access)</option>
                    <option value="staff">Staff (Manage assets &amp; assignments)</option>
                    <option value="admin">Admin (Full access including user management)</option>
                  </select>
                  <p className="mt-1 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                    {selectedRole === 'admin' && 'Admins can manage users, assets, and all assignments'}
                    {selectedRole === 'staff' && 'Staff can manage assets and create/edit assignments'}
                    {selectedRole === 'viewer' && 'Viewers can only view dashboard and assignments'}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
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
                    className="btn-primary flex items-center gap-2"
                    disabled={isSubmitting || !selectedEmployeeId}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
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
      )}
    </div>
  );
};

export default UserManagementPage;
