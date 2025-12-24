import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import Skeleton from '../components/Skeleton'
import EditAssetsModal from '../components/EditAssetsModal'
import TransferModal from '../components/TransferModal'
import SearchFilterPanel from '../components/SearchFilterPanel'

function AssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [transferringAssignment, setTransferringAssignment] = useState(null)
  const { addToast } = useToast()
  const { authFetch } = useAuth()
  const [searchFilter, setSearchFilter] = useState('')
  const [filters, setFilters] = useState({
    statuses: [],
    dateFrom: null,
    dateTo: null,
    assetCountMin: null,
    assetCountMax: null,
    department: null,
    reminderStatus: null
  })

  // Helper function to format dates as dd-mmm-yyyy HH:mm
  const formatDateTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}-${month}-${year} ${hours}:${minutes}`
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  // Auto-focus search when navigating with #search hash
  useEffect(() => {
    if (window.location.hash === '#search') {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
        searchInput.select();
      }
    }
  }, [])

  const fetchAssignments = async () => {
    try {
      const response = await authFetch('/api/handover/assignments')
      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }
      const data = await response.json()
      // Ensure data is an array before setting
      setAssignments(Array.isArray(data) ? data : [])
    } catch (error) {
      addToast('error', error.message || 'Failed to fetch assignments')
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (assignmentId) => {
    try {
      const response = await authFetch(`/api/handover/assignments/${assignmentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch assignment details')
      }
      const data = await response.json()
      setSelectedAssignment(data)
    } catch (error) {
      addToast('error', error.message || 'Failed to fetch assignment details')
    }
  }

  const handleDeleteAssignment = async (assignmentId, assignmentName) => {
    if (!confirm(`Are you sure you want to delete the assignment for ${assignmentName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await authFetch(`/api/handover/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete assignment')
      }

      addToast('success', 'Assignment deleted successfully')

      // Refresh assignments list
      await fetchAssignments()

      // Close modal if viewing deleted assignment
      if (selectedAssignment && selectedAssignment.id === assignmentId) {
        setSelectedAssignment(null)
      }
    } catch (error) {
      addToast('error', error.message)
    }
  }

  const handleResendEmail = async (assignmentId, assignmentName) => {
    if (!confirm(`Resend signing email to ${assignmentName}?`)) {
      return
    }

    try {
      const response = await authFetch(`/api/handover/resend/${assignmentId}`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend email')
      }

      addToast('success', 'Signing email resent successfully')

      // Refresh assignments list
      await fetchAssignments()
    } catch (error) {
      addToast('error', error.message)
    }
  }

  const closeModal = () => {
    setSelectedAssignment(null)
  }

  const handleEditAssets = async (assignmentId) => {
    try {
      const response = await authFetch(`/api/handover/assignments/${assignmentId}`)
      if (!response.ok) {
        throw new Error('Failed to load assignment for editing')
      }
      const data = await response.json()
      setEditingAssignment(data)
    } catch (error) {
      addToast('error', error.message || 'Failed to load assignment for editing')
    }
  }

  const handleEditSuccess = (successMessage) => {
    addToast('success', successMessage)
    fetchAssignments()
    // Refresh selected assignment details if it's open
    if (selectedAssignment && selectedAssignment.id === editingAssignment.id) {
      handleViewDetails(selectedAssignment.id)
    }
  }

  const handleTransfer = async (assignmentId) => {
    try {
      const response = await authFetch(`/api/handover/assignments/${assignmentId}`)
      if (!response.ok) {
        throw new Error('Failed to load assignment for transfer')
      }
      const data = await response.json()
      setTransferringAssignment(data)
    } catch (error) {
      addToast('error', error.message || 'Failed to load assignment for transfer')
    }
  }

  const handleTransferSuccess = (successMessage) => {
    addToast('success', successMessage)
    fetchAssignments()
  }

  const getFilteredAssignments = () => {
    let filtered = [...assignments]

    // Apply search filter
    if (searchFilter.trim()) {
      const searchLower = searchFilter.toLowerCase().trim()
      filtered = filtered.filter(assignment => {
        // Format dates for searching (dd-mmm-yyyy)
        let assignedDateString = ''
        let signedDateString = ''

        if (assignment.assigned_at) {
          const date = new Date(assignment.assigned_at)
          const day = String(date.getDate()).padStart(2, '0')
          const month = date.toLocaleDateString('en-US', { month: 'short' })
          const year = date.getFullYear()
          assignedDateString = `${day}-${month}-${year}`.toLowerCase()
        }

        if (assignment.signature_date) {
          const date = new Date(assignment.signature_date)
          const day = String(date.getDate()).padStart(2, '0')
          const month = date.toLocaleDateString('en-US', { month: 'short' })
          const year = date.getFullYear()
          signedDateString = `${day}-${month}-${year}`.toLowerCase()
        }

        // Status text for searching
        const statusText = assignment.is_signed ? 'signed' : assignment.is_disputed ? 'disputed' : assignment.pdf_sent ? 'sent' : 'pending'

        return (
          assignment.id?.toString().includes(searchLower) ||
          assignment.employee_name?.toLowerCase().includes(searchLower) ||
          assignment.employee_id?.toLowerCase().includes(searchLower) ||
          assignment.email?.toLowerCase().includes(searchLower) ||
          assignment.office_college?.toLowerCase().includes(searchLower) ||
          assignment.asset_codes?.toLowerCase().includes(searchLower) ||
          assignedDateString.includes(searchLower) ||
          signedDateString.includes(searchLower) ||
          statusText.includes(searchLower)
        )
      })
    }

    // Apply status filters
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(assignment => {
        const hasStatus = (status) => {
          switch (status) {
            case 'signed':
              return assignment.is_signed === 1
            case 'unsigned':
              return assignment.is_signed === 0 && !assignment.is_disputed
            case 'disputed':
              return assignment.is_disputed === 1
            case 'expiring': {
              if (assignment.is_signed || !assignment.token_expires_at) return false
              const daysUntilExpiry = Math.ceil((new Date(assignment.token_expires_at) - new Date()) / (1000 * 60 * 60 * 24))
              return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
            }
            case 'expired': {
              if (!assignment.token_expires_at) return false
              return new Date(assignment.token_expires_at) < new Date() && assignment.is_signed === 0
            }
            case 'backup':
              return assignment.signed_by_email && assignment.signed_by_email !== assignment.email
            default:
              return false
          }
        }
        return filters.statuses.some(hasStatus)
      })
    }

    // Apply date range filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(assignment => {
        const assignedDate = new Date(assignment.assigned_at)
        return assignedDate >= fromDate
      })
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(assignment => {
        const assignedDate = new Date(assignment.assigned_at)
        return assignedDate <= toDate
      })
    }

    // Apply asset count filters
    if (filters.assetCountMin !== null && filters.assetCountMin !== '') {
      filtered = filtered.filter(assignment => {
        const assetCount = assignment.asset_codes ? assignment.asset_codes.split(',').length : 0
        return assetCount >= filters.assetCountMin
      })
    }

    if (filters.assetCountMax !== null && filters.assetCountMax !== '') {
      filtered = filtered.filter(assignment => {
        const assetCount = assignment.asset_codes ? assignment.asset_codes.split(',').length : 0
        return assetCount <= filters.assetCountMax
      })
    }

    // Apply department filter
    if (filters.department) {
      filtered = filtered.filter(assignment => assignment.office_college === filters.department)
    }

    // Apply reminder status filter
    if (filters.reminderStatus) {
      filtered = filtered.filter(assignment => {
        const count = assignment.reminder_count || 0
        switch (filters.reminderStatus) {
          case 'none':
            return count === 0
          case 'few':
            return count >= 1 && count <= 2
          case 'many':
            return count >= 3 && count <= 4
          case 'max':
            return count === 4
          default:
            return true
        }
      })
    }

    return filtered
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">

      <div className="premium-card p-8">
        <h2 className="text-2xl font-bold mb-2 gradient-text">
          Asset Assignments
        </h2>
        <p className="text-text-secondary mb-8">
          View all asset handover assignments and their status
        </p>

        {/* Search and Filter Panel */}
        {!loading && assignments.length > 0 && (
          <SearchFilterPanel
            assignments={assignments}
            filteredAssignments={getFilteredAssignments()}
            searchTerm={searchFilter}
            onSearchChange={setSearchFilter}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {loading ? (
            <div className="space-y-4 py-16">
              <Skeleton variant="text" height="h-8" width="w-64" className="mx-auto" />
              <div className="overflow-x-auto">
                <table className="table-premium w-full">
                  <thead>
                    <tr>
                      {[...Array(9)].map((_, i) => (
                        <th key={i} className="p-4">
                          <Skeleton variant="text" height="h-4" width="w-20" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, row) => (
                      <tr key={row}>
                        {[...Array(9)].map((_, col) => (
                          <td key={col} className="p-4">
                            <Skeleton variant="text" height="h-4" width={col === 0 ? 'w-12' : 'w-full'} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <i className="fas fa-list-alt text-6xl text-text-light mb-6 opacity-50"></i>
              <h3 className="text-2xl font-bold mb-3 gradient-text">No Assignments Yet</h3>
              <p className="text-text-secondary mb-8 max-w-md">Create your first asset handover assignment from the Handover page.</p>
              <button className="btn-premium" onClick={() => window.location.href = '/handover'}>
                <i className="fas fa-handshake"></i> Create Assignment
              </button>
            </div>
          ) : getFilteredAssignments().length === 0 ? (
            <div className="notification-premium notification-info text-center py-12">
              <i className="fas fa-filter text-4xl mb-4 opacity-75"></i>
              <h3 className="text-xl font-bold mb-2">No Matching Assignments</h3>
              <p className="text-text-secondary mb-4">Adjust your filters or search terms to see results.</p>
              <div className="flex gap-3 justify-center">
                <button className="btn-secondary" onClick={() => setSearchFilter('')}>Clear Search</button>
                <button className="btn-secondary" onClick={() => setFilters({ statuses: [], dateFrom: null, dateTo: null, assetCountMin: null, assetCountMax: null, department: null, reminderStatus: null })}>Clear Filters</button>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Employee Name</th>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Office/College</th>
                    <th>Assets</th>
                    <th>Assigned Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAssignments().map(assignment => (
                    <tr key={assignment.id}>
                      <td>
                        <strong className="text-text-primary">#{assignment.id}</strong>
                      </td>
                      <td className="text-text-secondary">
                        {assignment.employee_name || '-'}
                      </td>
                      <td className="text-text-secondary">
                        {assignment.employee_id || '-'}
                      </td>
                      <td className="text-text-secondary">
                        {assignment.email || '-'}
                      </td>
                      <td className="text-text-secondary">
                        {assignment.office_college || '-'}
                      </td>
                      <td>
                        <span className="badge-premium badge-info whitespace-nowrap">
                          {assignment.asset_codes ? assignment.asset_codes.split(',').length : 0} assets
                        </span>
                      </td>
                      <td className="text-text-secondary">
                        {formatDateTime(assignment.assigned_at)}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <span className={`badge-premium whitespace-nowrap ${
                            assignment.is_signed
                              ? 'badge-success'
                              : assignment.is_disputed
                                ? 'badge-error'
                                : assignment.pdf_sent
                                  ? 'badge-info'
                                  : 'badge-warning'
                          }`}>
                            <i className={`fas fa-${
                              assignment.is_signed
                                ? 'check-circle'
                                : assignment.is_disputed
                                  ? 'exclamation-triangle'
                                  : assignment.pdf_sent
                                    ? 'envelope'
                                    : 'clock'
                            }`}></i>
                            <span>
                              {assignment.is_signed
                                ? 'Signed'
                                : assignment.is_disputed
                                  ? 'Disputed'
                                  : assignment.pdf_sent
                                    ? 'Sent'
                                    : 'Pending'}
                            </span>
                          </span>
                          {assignment.transfer_status === 'transferred_out' && (
                            <span className="badge-premium whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white' }}>
                              <i className="fas fa-arrow-right"></i>
                              <span>Transferred</span>
                            </span>
                          )}
                          {assignment.transfer_status === 'transferred_in' && (
                            <span className="badge-premium whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', color: 'white' }}>
                              <i className="fas fa-arrow-left"></i>
                              <span>Via Transfer</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="btn-premium inline-flex items-center gap-2 text-sm py-2 px-4"
                            onClick={() => handleViewDetails(assignment.id)}
                            title="View details"
                          >
                            <i className="fas fa-eye"></i>
                            <span>View</span>
                          </button>
                          {!assignment.is_signed && !assignment.is_disputed && (
                            <button
                              className="inline-flex items-center gap-2 text-sm py-2 px-4 rounded-lg font-medium transition-all duration-200"
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleEditAssets(assignment.id)}
                              title="Edit assigned assets"
                            >
                              <i className="fas fa-edit"></i>
                              <span>Edit Assets</span>
                            </button>
                          )}
                          {!!assignment.pdf_sent && !assignment.is_signed && !assignment.is_disputed && (
                            <button
                              className="btn-secondary inline-flex items-center gap-2 text-sm py-2 px-4"
                              onClick={() => handleResendEmail(assignment.id, assignment.employee_name)}
                              title="Resend signing email"
                            >
                              <i className="fas fa-paper-plane"></i>
                              <span>Resend</span>
                            </button>
                          )}
                          {!!assignment.is_signed && !assignment.is_disputed && !assignment.transfer_status && (
                            <button
                              className="inline-flex items-center gap-2 text-sm py-2 px-4 rounded-lg font-medium transition-all duration-200"
                              style={{
                                background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleTransfer(assignment.id)}
                              title="Transfer assets to another employee"
                            >
                              <i className="fas fa-exchange-alt"></i>
                              <span>Transfer</span>
                            </button>
                          )}
                          {!assignment.is_signed && (
                            <button
                              className="inline-flex items-center gap-2 text-sm py-2 px-4 rounded-lg font-medium transition-all duration-200"
                              style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleDeleteAssignment(assignment.id, assignment.employee_name)}
                              title="Delete assignment"
                            >
                              <i className="fas fa-trash"></i>
                              <span>Delete</span>
                            </button>
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

      {selectedAssignment && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="modal-content w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border">
              <h3 className="text-xl font-bold gradient-text">
                Assignment Details #{selectedAssignment.id}
              </h3>
              <button
                className="text-3xl font-bold leading-none opacity-50 hover:opacity-100 transition-opacity text-text-primary"
                onClick={closeModal}
                aria-label="close"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Employee Information Section */}
              <div className="section-divider">
                <h4 className="text-lg font-bold gradient-text">Employee Information</h4>
              </div>
              <div className="mb-8">
                <table className="table-premium">
                  <tbody>
                    <tr>
                      <th className="w-2/5 bg-table-header-bg text-table-header-text font-semibold">Name:</th>
                      <td className="text-text-secondary">
                        {selectedAssignment.employee_name}
                      </td>
                    </tr>
                    {selectedAssignment.employee_id && (
                      <tr>
                        <th className="bg-table-header-bg text-table-header-text font-semibold">Employee ID:</th>
                        <td className="text-text-secondary">
                          {selectedAssignment.employee_id}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th className="bg-table-header-bg text-table-header-text font-semibold">Email:</th>
                      <td className="text-text-secondary">
                        {selectedAssignment.email}
                      </td>
                    </tr>
                    {selectedAssignment.office_college && (
                      <tr>
                        <th className="bg-table-header-bg text-table-header-text font-semibold">Office/College:</th>
                        <td className="text-text-secondary">
                          {selectedAssignment.office_college}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Assigned Assets Section */}
              <div className="section-divider mt-6">
                <h4 className="text-lg font-bold gradient-text">Assigned Assets</h4>
              </div>
              {selectedAssignment.assets && selectedAssignment.assets.length > 0 ? (
                <div className="mb-8">
                  <table className="table-premium">
                    <thead>
                      <tr>
                        <th>Asset Code</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Model</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAssignment.assets.map(asset => (
                        <tr key={asset.id}>
                          <td>
                            <strong className="text-text-primary">{asset.asset_code}</strong>
                          </td>
                          <td className="text-text-secondary">
                            {asset.asset_type}
                          </td>
                          <td className="text-text-secondary">
                            {asset.description || '-'}
                          </td>
                          <td className="text-text-secondary">
                            {asset.model || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-secondary mb-8">No assets assigned</p>
              )}

              {/* Assignment Information Section */}
              <div className="section-divider mt-6">
                <h4 className="text-lg font-bold gradient-text">Assignment Information</h4>
              </div>
              <div>
                <table className="table-premium">
                  <tbody>
                    <tr>
                      <th className="w-2/5 bg-table-header-bg text-table-header-text font-semibold">Assigned Date:</th>
                      <td className="text-text-secondary">
                        {formatDateTime(selectedAssignment.assigned_at)}
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-table-header-bg text-table-header-text font-semibold">Status:</th>
                      <td>
                        <span className={`badge-premium ${
                          selectedAssignment.is_signed
                            ? 'badge-success'
                            : selectedAssignment.pdf_sent
                              ? 'badge-info'
                              : 'badge-warning'
                        }`}>
                          <i className={`fas fa-${
                            selectedAssignment.is_signed
                              ? 'check-circle'
                              : selectedAssignment.pdf_sent
                                ? 'envelope'
                                : 'clock'
                          } mr-2`}></i>
                          {selectedAssignment.is_signed
                            ? 'Signed'
                            : selectedAssignment.pdf_sent
                              ? 'Sent (Awaiting Signature)'
                              : 'Pending'}
                        </span>
                      </td>
                    </tr>
                    {selectedAssignment.is_signed && selectedAssignment.signature_date && (
                      <>
                        <tr>
                          <th className="bg-table-header-bg text-table-header-text font-semibold">Signed Date:</th>
                          <td className="text-text-secondary">
                            {formatDateTime(selectedAssignment.signature_date)}
                          </td>
                        </tr>
                        {selectedAssignment.signed_by_email && (
                          <tr>
                            <th className="bg-table-header-bg text-table-header-text font-semibold">Signed By:</th>
                            <td className="text-text-secondary">
                              {selectedAssignment.signed_by_email}
                              {selectedAssignment.signed_by_email !== selectedAssignment.email && (
                                <span className="ml-2 px-2 py-1 bg-warning/20 text-warning rounded text-xs font-semibold">
                                  <i className="fas fa-user-tie"></i> Backup Signer
                                </span>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center gap-3 p-6 border-t border">
              <div style={{ display: 'flex', gap: '10px' }}>
                {!selectedAssignment.is_signed && !selectedAssignment.is_disputed && (
                  <button
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-lg font-medium transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      handleEditAssets(selectedAssignment.id)
                      closeModal()
                    }}
                  >
                    <i className="fas fa-edit"></i>
                    <span>Edit Assets</span>
                  </button>
                )}
                {!!selectedAssignment.is_signed && !selectedAssignment.is_disputed && !selectedAssignment.transfer_status && (
                  <button
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-lg font-medium transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      handleTransfer(selectedAssignment.id)
                      closeModal()
                    }}
                  >
                    <i className="fas fa-exchange-alt"></i>
                    <span>Transfer Assets</span>
                  </button>
                )}
                {!!selectedAssignment.pdf_sent && !selectedAssignment.is_signed && !selectedAssignment.is_disputed && (
                  <button
                    className="btn-secondary inline-flex items-center gap-2"
                    onClick={() => {
                      handleResendEmail(selectedAssignment.id, selectedAssignment.employee_name)
                      closeModal()
                    }}
                  >
                    <i className="fas fa-paper-plane"></i>
                    <span>Resend Email</span>
                  </button>
                )}
                {!selectedAssignment.is_signed && (
                  <button
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-lg font-medium transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      handleDeleteAssignment(selectedAssignment.id, selectedAssignment.employee_name)
                      closeModal()
                    }}
                  >
                    <i className="fas fa-trash"></i>
                    <span>Delete Assignment</span>
                  </button>
                )}
              </div>
              <button
                className="btn-premium"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingAssignment && (
        <EditAssetsModal
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {transferringAssignment && (
        <TransferModal
          assignment={transferringAssignment}
          onClose={() => setTransferringAssignment(null)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  )
}

export default AssignmentsPage
