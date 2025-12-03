import { useState, useEffect } from 'react'

function AssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [message, setMessage] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')

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

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/handover/assignments')
      const data = await response.json()
      setAssignments(data)
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to fetch assignments' })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (assignmentId) => {
    try {
      const response = await fetch(`/api/handover/assignments/${assignmentId}`)
      const data = await response.json()
      setSelectedAssignment(data)
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to fetch assignment details' })
    }
  }

  const handleDeleteAssignment = async (assignmentId, assignmentName) => {
    if (!confirm(`Are you sure you want to delete the assignment for ${assignmentName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/handover/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete assignment')
      }

      setMessage({
        type: 'success',
        text: 'Assignment deleted successfully'
      })

      // Refresh assignments list
      await fetchAssignments()

      // Close modal if viewing deleted assignment
      if (selectedAssignment && selectedAssignment.id === assignmentId) {
        setSelectedAssignment(null)
      }
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.message
      })
    }
  }

  const handleResendEmail = async (assignmentId, assignmentName) => {
    if (!confirm(`Resend signing email to ${assignmentName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/handover/resend/${assignmentId}`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend email')
      }

      setMessage({
        type: 'success',
        text: 'Signing email resent successfully'
      })

      // Refresh assignments list
      await fetchAssignments()
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.message
      })
    }
  }

  const closeModal = () => {
    setSelectedAssignment(null)
  }

  const getFilteredAssignments = () => {
    if (!searchFilter.trim()) {
      return assignments
    }

    const searchLower = searchFilter.toLowerCase().trim()
    return assignments.filter(assignment => {
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
      const statusText = assignment.is_signed ? 'signed' : assignment.pdf_sent ? 'sent' : 'pending'

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

  const clearFilter = () => {
    setSearchFilter('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      {message && (
        <div className={`notification-premium mb-6 ${
          message.type === 'success' ? 'notification-success' :
          message.type === 'danger' ? 'notification-danger' :
          'notification-info'
        }`}>
          <i className={`fas text-xl ${
            message.type === 'success' ? 'fa-check-circle' :
            message.type === 'danger' ? 'fa-exclamation-circle' :
            'fa-info-circle'
          }`}></i>
          <span className="flex-1">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-2xl font-bold leading-none opacity-50 hover:opacity-100 transition-opacity"
          >
            &times;
          </button>
        </div>
      )}

      <div className="premium-card p-8">
        <h2 className="text-2xl font-bold mb-2 gradient-text">
          Asset Assignments
        </h2>
        <p className="text-text-secondary mb-8">
          View all asset handover assignments and their status
        </p>

        {/* Search/Filter Section */}
        {!loading && assignments.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID, employee name, email, office/college, asset codes, date, or status..."
                className="input-premium pl-10 pr-20"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light"></i>
              {searchFilter && (
                <button
                  type="button"
                  onClick={clearFilter}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light hover:text-text-primary transition-colors"
                  title="Clear filter"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            {searchFilter && (
              <p className="text-sm text-text-secondary mt-2">
                Showing {getFilteredAssignments().length} of {assignments.length} assignments
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="spinner-premium"></div>
            <p className="mt-4 text-text-secondary">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-semibold text-text-primary">No assignments found</p>
            <p className="text-text-secondary">Create your first asset handover assignment</p>
          </div>
        ) : getFilteredAssignments().length === 0 ? (
          <div className="notification-premium notification-info">
            <i className="fas fa-info-circle text-xl"></i>
            <span>No assignments match your search criteria. Try a different search term.</span>
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
                      <span className={`badge-premium whitespace-nowrap ${
                        assignment.is_signed
                          ? 'badge-success'
                          : assignment.pdf_sent
                            ? 'badge-info'
                            : 'badge-warning'
                      }`}>
                        <i className={`fas fa-${
                          assignment.is_signed
                            ? 'check-circle'
                            : assignment.pdf_sent
                              ? 'envelope'
                              : 'clock'
                        }`}></i>
                        <span>
                          {assignment.is_signed
                            ? 'Signed'
                            : assignment.pdf_sent
                              ? 'Sent'
                              : 'Pending'}
                        </span>
                      </span>
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
                        {assignment.pdf_sent && !assignment.is_signed && (
                          <button
                            className="btn-secondary inline-flex items-center gap-2 text-sm py-2 px-4"
                            onClick={() => handleResendEmail(assignment.id, assignment.employee_name)}
                            title="Resend signing email"
                          >
                            <i className="fas fa-paper-plane"></i>
                            <span>Resend</span>
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
                {selectedAssignment.pdf_sent && !selectedAssignment.is_signed && (
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
    </div>
  )
}

export default AssignmentsPage
