import { useState, useEffect } from 'react'

function AssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [message, setMessage] = useState(null)

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

  const closeModal = () => {
    setSelectedAssignment(null)
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
                  <th>PDF Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={assignment.id}>
                    <td>
                      <strong className="text-text-primary">#{assignment.id}</strong>
                    </td>
                    <td className="text-text-secondary">
                      {assignment.employee_name}
                    </td>
                    <td className="text-text-secondary">
                      {assignment.employee_id || '-'}
                    </td>
                    <td className="text-text-secondary">
                      {assignment.email}
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
                      {new Date(assignment.assigned_at).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge-premium whitespace-nowrap ${
                        assignment.pdf_sent ? 'badge-success' : 'badge-danger'
                      }`}>
                        <i className={`fas fa-${assignment.pdf_sent ? 'check' : 'times'}`}></i>
                        <span>{assignment.pdf_sent ? 'Sent' : 'Not Sent'}</span>
                      </span>
                    </td>
                    <td>
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                        onClick={() => handleViewDetails(assignment.id)}
                      >
                        <i className="fas fa-eye"></i>
                        <span>View</span>
                      </button>
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
                        {new Date(selectedAssignment.assigned_at).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-table-header-bg text-table-header-text font-semibold">PDF Sent:</th>
                      <td>
                        <span className={`badge-premium ${
                          selectedAssignment.pdf_sent ? 'badge-success' : 'badge-danger'
                        }`}>
                          {selectedAssignment.pdf_sent ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border">
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
