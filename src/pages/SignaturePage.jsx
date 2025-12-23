import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'

function SignaturePage() {
  const { token } = useParams()
  const sigCanvas = useRef(null)

  // State management
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [locationBuilding, setLocationBuilding] = useState('')
  const [locationFloor, setLocationFloor] = useState('')
  const [locationSection, setLocationSection] = useState('')
  const [deviceType, setDeviceType] = useState([]) // Array for multiple selections
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [hasSignature, setHasSignature] = useState(false) // Track signature state
  const [signingEmail, setSigningEmail] = useState('') // Track which email is signing

  // Location options
  const [locationOptions, setLocationOptions] = useState({
    building: [],
    floor: [],
    section: []
  })
  const [showAddLocationModal, setShowAddLocationModal] = useState(false)
  const [addLocationCategory, setAddLocationCategory] = useState('')
  const [newLocationValue, setNewLocationValue] = useState('')
  const [isAddingLocation, setIsAddingLocation] = useState(false)

  // Fetch assignment data and determine signing email
  useEffect(() => {
    fetchAssignment()
    fetchLocationOptions()
  }, [token])

  // Set signing email when assignment loads
  useEffect(() => {
    if (assignment) {
      // Check URL for email hint (for backup signer)
      const urlParams = new URLSearchParams(window.location.search)
      const emailHint = urlParams.get('email')
      setSigningEmail(emailHint || assignment.email)
    }
  }, [assignment])

  const fetchAssignment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/handover/sign/${token}`)

      if (response.status === 404) {
        setError('Invalid signing link. Please check your email for the correct link.')
        return
      }

      if (response.status === 410) {
        setError('This signing link has expired. Please contact the administrator.')
        return
      }

      if (response.status === 409) {
        setError('This form has already been signed. Thank you!')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load assignment data')
      }

      const data = await response.json()
      setAssignment(data)
    } catch (err) {
      setError(err.message || 'An error occurred while loading the form')
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationOptions = async () => {
    try {
      const response = await fetch('/api/locations/options')
      if (response.ok) {
        const data = await response.json()
        setLocationOptions(data)
      }
    } catch (err) {
      console.error('Failed to load location options:', err)
    }
  }

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
      setHasSignature(false)
    }
  }

  const handleSignatureEnd = () => {
    // Called when user finishes drawing
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setHasSignature(true)
    }
  }

  const isSignatureEmpty = () => {
    // Return true if canvas ref is not yet attached or if signature is empty
    if (!sigCanvas.current) return true
    return sigCanvas.current.isEmpty()
  }

  const isFormValid = () => {
    return hasSignature && !isSignatureEmpty()
  }

  const handleDeviceTypeToggle = (type) => {
    if (deviceType.includes(type)) {
      setDeviceType(deviceType.filter(t => t !== type))
    } else {
      setDeviceType([...deviceType, type])
    }
  }

  const openAddLocationModal = (category) => {
    setAddLocationCategory(category)
    setNewLocationValue('')
    setShowAddLocationModal(true)
  }

  const handleAddLocation = async () => {
    if (!newLocationValue.trim()) {
      setMessage({
        type: 'danger',
        text: 'Please enter a value'
      })
      return
    }

    setIsAddingLocation(true)
    try {
      const response = await fetch('/api/locations/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: addLocationCategory,
          value: newLocationValue.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add location option')
      }

      const data = await response.json()

      // Refresh location options
      await fetchLocationOptions()

      // Auto-select the newly added option
      if (addLocationCategory === 'building') {
        setLocationBuilding(newLocationValue.trim())
      } else if (addLocationCategory === 'floor') {
        setLocationFloor(newLocationValue.trim())
      } else if (addLocationCategory === 'section') {
        setLocationSection(newLocationValue.trim())
      }

      setShowAddLocationModal(false)
      setMessage({
        type: 'success',
        text: `Location option "${newLocationValue.trim()}" added successfully`
      })
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.message
      })
    } finally {
      setIsAddingLocation(false)
    }
  }

  const handleSubmitSignature = async () => {
    if (!isFormValid()) {
      setMessage({
        type: 'danger',
        text: 'Please provide your signature'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const signatureData = sigCanvas.current.toDataURL()

      const response = await fetch(`/api/handover/submit-signature/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_building: locationBuilding || null,
          location_floor: locationFloor || null,
          location_section: locationSection || null,
          device_type: deviceType.length > 0 ? deviceType.join(', ') : null,
          signature_data: signatureData,
          signing_email: signingEmail  // Track which email is signing
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit signature')
      }

      setMessage({
        type: 'success',
        text: 'Thank you! Your signature has been submitted successfully. You will receive a signed copy via email shortly.'
      })

      // Reload assignment to show signed state
      setTimeout(() => {
        fetchAssignment()
      }, 2000)
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      setMessage({
        type: 'danger',
        text: 'Please provide a reason for the dispute'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/handover/dispute/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_reason: disputeReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit dispute')
      }

      setMessage({
        type: 'success',
        text: 'Your dispute has been submitted. The administrator will contact you shortly.'
      })
      setShowDisputeModal(false)
      setDisputeReason('')
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner-premium"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-5">
        <div className="premium-card max-w-md w-full text-center">
          <div className="card-body">
            <i className="fas fa-exclamation-circle text-6xl text-danger mb-5"></i>
            <h2 className="gradient-text mb-4">Access Error</h2>
            <p className="text-text-secondary">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-10 px-5">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="gradient-text text-3xl mb-2">
            Asset Handover Acknowledgement
          </h1>
          <p className="text-text-secondary">
            Ajman University - Main Store
          </p>
        </div>

        {/* Notification Message */}
        {message && (
          <div className={`notification-premium notification-${message.type} mb-8`}>
            {message.text}
          </div>
        )}

        {/* Employee Information */}
        <div className="premium-card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold m-0">Employee Information</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block mb-1 text-sm font-medium text-text-secondary">Employee Name</label>
                <div className="info-display-field">
                  {assignment.employee_name}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-text-secondary">Employee ID</label>
                <div className="info-display-field">
                  {assignment.employee_id_number || 'N/A'}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-text-secondary">Email</label>
                <div className="info-display-field">
                  {assignment.email}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-text-secondary">Office/College</label>
                <div className="info-display-field">
                  {assignment.office_college || 'N/A'}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-text-secondary">Assignment Date</label>
                <div className="info-display-field">
                  {formatDate(assignment.assigned_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Assets */}
        <div className="premium-card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold m-0">Assigned Assets</h2>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Asset Code</th>
                    <th>Asset Type</th>
                    <th>Description</th>
                    <th>Model</th>
                    <th>Serial Number</th>
                  </tr>
                </thead>
                <tbody>
                  {assignment.assets && assignment.assets.length > 0 ? (
                    assignment.assets.map((asset) => (
                      <tr key={asset.id}>
                        <td><strong>{asset.asset_code}</strong></td>
                        <td>{asset.asset_type}</td>
                        <td>{asset.description || 'N/A'}</td>
                        <td>{asset.model || 'N/A'}</td>
                        <td>{asset.serial_number || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-text-secondary">
                        No assets assigned
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="premium-card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold m-0">Location Information (Optional)</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label htmlFor="building" className="block mb-2 text-sm font-medium text-text-primary">
                  Building
                </label>
                <div className="flex gap-2">
                  <select
                    id="building"
                    className="input-premium flex-1"
                    value={locationBuilding}
                    onChange={(e) => setLocationBuilding(e.target.value)}
                  >
                    <option value="">Select Building</option>
                    {locationOptions.building.map(opt => (
                      <option key={opt.id} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary btn-icon-only"
                    onClick={() => openAddLocationModal('building')}
                    disabled={isSubmitting}
                    title="Add new building"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="floor" className="block mb-2 text-sm font-medium text-text-primary">
                  Floor
                </label>
                <div className="flex gap-2">
                  <select
                    id="floor"
                    className="input-premium flex-1"
                    value={locationFloor}
                    onChange={(e) => setLocationFloor(e.target.value)}
                  >
                    <option value="">Select Floor</option>
                    {locationOptions.floor.map(opt => (
                      <option key={opt.id} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary btn-icon-only"
                    onClick={() => openAddLocationModal('floor')}
                    disabled={isSubmitting}
                    title="Add new floor"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="section" className="block mb-2 text-sm font-medium text-text-primary">
                  Section
                </label>
                <div className="flex gap-2">
                  <select
                    id="section"
                    className="input-premium flex-1"
                    value={locationSection}
                    onChange={(e) => setLocationSection(e.target.value)}
                  >
                    <option value="">Select Section</option>
                    {locationOptions.section.map(opt => (
                      <option key={opt.id} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary btn-icon-only"
                    onClick={() => openAddLocationModal('section')}
                    disabled={isSubmitting}
                    title="Add new section"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Device Type */}
        <div className="premium-card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold m-0">Device Type (Optional)</h2>
          </div>
          <div className="card-body">
            <p className="mb-4 text-text-secondary text-sm">
              Select where these devices will be used. You can select multiple options.
            </p>
            <div className="flex flex-col gap-4">
              <label className={`device-type-option ${deviceType.includes('Office Device') ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={deviceType.includes('Office Device')}
                  onChange={() => handleDeviceTypeToggle('Office Device')}
                  disabled={isSubmitting}
                  className="device-type-checkbox"
                />
                <div className="flex-1">
                  <div className="font-semibold text-text-primary mb-1">
                    Office Device
                  </div>
                  <div className="text-sm text-text-secondary leading-relaxed">
                    I understand that I will be responsible for any misuse or damages that may occur. I confirm that this device(s) will be used for work purpose only.
                  </div>
                </div>
              </label>
              <label className={`device-type-option ${deviceType.includes('Lab Device') ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={deviceType.includes('Lab Device')}
                  onChange={() => handleDeviceTypeToggle('Lab Device')}
                  disabled={isSubmitting}
                  className="device-type-checkbox"
                />
                <div className="flex-1">
                  <div className="font-semibold text-text-primary mb-1">
                    Lab Device
                  </div>
                  <div className="text-sm text-text-secondary leading-relaxed">
                    I understand that the lab supervisor shall monitor the lab devices to avoid any misuse or damage.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="premium-card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold m-0">Digital Signature</h2>
          </div>
          <div className="card-body">
            <p className="mb-4 text-text-secondary text-sm">
              Please sign in the box below to acknowledge receipt of the assigned assets.
            </p>
            <div className="signature-canvas-wrapper">
              <SignatureCanvas
                ref={sigCanvas}
                onEnd={handleSignatureEnd}
                canvasProps={{
                  className: 'signature-canvas'
                }}
              />
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={clearSignature}
              disabled={isSubmitting}
            >
              <i className="fas fa-eraser"></i> Clear Signature
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            type="button"
            className="btn-premium min-w-48 flex items-center justify-center gap-2"
            onClick={handleSubmitSignature}
            disabled={isSubmitting || !isFormValid()}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-check-circle"></i> Confirm & Sign
              </>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary min-w-48 flex items-center justify-center gap-2"
            onClick={() => setShowDisputeModal(true)}
            disabled={isSubmitting}
          >
            <i className="fas fa-exclamation-triangle"></i> Dispute Assets
          </button>
        </div>

        {/* Dispute Modal */}
        {showDisputeModal && (
          <div className="modal-overlay animate-fadeIn" onClick={() => !isSubmitting && setShowDisputeModal(false)}>
            <div className="modal-content animate-scaleIn max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <h2 className="text-xl font-semibold m-0">Dispute Assets</h2>
              </div>
              <div className="card-body">
                <p className="mb-4 text-text-secondary">
                  Please explain why you are disputing the assigned assets. The administrator will review your concern and contact you.
                </p>
                <label htmlFor="disputeReason" className="block mb-2 text-sm font-medium text-text-primary">
                  Dispute Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  id="disputeReason"
                  className="input-premium resize-y"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Enter your reason for disputing..."
                  rows="5"
                  disabled={isSubmitting}
                ></textarea>
                <div className="flex gap-3 mt-5">
                  <button
                    type="button"
                    className="btn-secondary flex-1"
                    onClick={() => setShowDisputeModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-premium flex-1"
                    onClick={handleSubmitDispute}
                    disabled={isSubmitting || !disputeReason.trim()}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Location Modal */}
        {showAddLocationModal && (
          <div className="modal-overlay animate-fadeIn" onClick={() => !isAddingLocation && setShowAddLocationModal(false)}>
            <div className="modal-content animate-scaleIn max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <h2 className="text-xl font-semibold m-0">
                  Add New {addLocationCategory === 'building' ? 'Building' : addLocationCategory === 'floor' ? 'Floor' : 'Section'}
                </h2>
              </div>
              <div className="card-body">
                <p className="mb-4 text-text-secondary text-sm">
                  Enter a new {addLocationCategory} option. It will be available for future use.
                </p>
                <label htmlFor="newLocationValue" className="block mb-2 text-sm font-medium text-text-primary">
                  {addLocationCategory === 'building' ? 'Building Name' : addLocationCategory === 'floor' ? 'Floor Name' : 'Section Name'} <span className="text-danger">*</span>
                </label>
                <input
                  id="newLocationValue"
                  type="text"
                  className="input-premium"
                  value={newLocationValue}
                  onChange={(e) => setNewLocationValue(e.target.value)}
                  placeholder={`Enter ${addLocationCategory} name`}
                  disabled={isAddingLocation}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newLocationValue.trim()) {
                      handleAddLocation()
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-3 mt-5">
                  <button
                    type="button"
                    className="btn-secondary flex-1"
                    onClick={() => setShowAddLocationModal(false)}
                    disabled={isAddingLocation}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-premium flex-1 flex items-center justify-center gap-2"
                    onClick={handleAddLocation}
                    disabled={isAddingLocation || !newLocationValue.trim()}
                  >
                    {isAddingLocation ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus"></i> Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SignaturePage
