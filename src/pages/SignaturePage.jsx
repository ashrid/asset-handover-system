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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--theme-bg-primary)'
      }}>
        <div className="spinner-premium"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--theme-bg-primary)',
        padding: '20px'
      }}>
        <div className="premium-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <div className="card-body">
            <i className="fas fa-exclamation-circle" style={{
              fontSize: '64px',
              color: 'var(--theme-danger)',
              marginBottom: '20px'
            }}></i>
            <h2 className="gradient-text" style={{ marginBottom: '15px' }}>Access Error</h2>
            <p style={{ color: 'var(--theme-text-secondary)', fontSize: '16px' }}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--theme-bg-primary)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="gradient-text" style={{ fontSize: '32px', marginBottom: '10px' }}>
            Asset Handover Acknowledgement
          </h1>
          <p style={{ color: 'var(--theme-text-secondary)', fontSize: '16px' }}>
            Ajman University - Main Store
          </p>
        </div>

        {/* Notification Message */}
        {message && (
          <div className={`notification-premium ${message.type}`} style={{ marginBottom: '30px' }}>
            {message.text}
          </div>
        )}

        {/* Employee Information */}
        <div className="premium-card" style={{ marginBottom: '30px' }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '20px' }}>Employee Information</h2>
          </div>
          <div className="card-body">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-secondary)'
                }}>Employee Name</label>
                <div style={{
                  padding: '10px 15px',
                  background: 'var(--theme-bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--theme-text-primary)'
                }}>
                  {assignment.employee_name}
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-secondary)'
                }}>Employee ID</label>
                <div style={{
                  padding: '10px 15px',
                  background: 'var(--theme-bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--theme-text-primary)'
                }}>
                  {assignment.employee_id_number || 'N/A'}
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-secondary)'
                }}>Email</label>
                <div style={{
                  padding: '10px 15px',
                  background: 'var(--theme-bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--theme-text-primary)'
                }}>
                  {assignment.email}
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-secondary)'
                }}>Office/College</label>
                <div style={{
                  padding: '10px 15px',
                  background: 'var(--theme-bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--theme-text-primary)'
                }}>
                  {assignment.office_college || 'N/A'}
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-secondary)'
                }}>Assignment Date</label>
                <div style={{
                  padding: '10px 15px',
                  background: 'var(--theme-bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--theme-text-primary)'
                }}>
                  {formatDate(assignment.assigned_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Assets */}
        <div className="premium-card" style={{ marginBottom: '30px' }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '20px' }}>Assigned Assets</h2>
          </div>
          <div className="card-body">
            <div style={{ overflowX: 'auto' }}>
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
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--theme-text-secondary)' }}>
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
        <div className="premium-card" style={{ marginBottom: '30px' }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '20px' }}>Location Information (Optional)</h2>
          </div>
          <div className="card-body">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <label htmlFor="building" style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-primary)'
                }}>
                  Building
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                  <select
                    id="building"
                    className="input-premium"
                    value={locationBuilding}
                    onChange={(e) => setLocationBuilding(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Building</option>
                    {locationOptions.building.map(opt => (
                      <option key={opt.id} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => openAddLocationModal('building')}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 15px',
                      minWidth: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Add new building"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="floor" style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-primary)'
                }}>
                  Floor
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                  <select
                    id="floor"
                    className="input-premium"
                    value={locationFloor}
                    onChange={(e) => setLocationFloor(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Floor</option>
                    {locationOptions.floor.map(opt => (
                      <option key={opt.id} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => openAddLocationModal('floor')}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 15px',
                      minWidth: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Add new floor"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="section" style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-primary)'
                }}>
                  Section
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                  <select
                    id="section"
                    className="input-premium"
                    value={locationSection}
                    onChange={(e) => setLocationSection(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Section</option>
                    {locationOptions.section.map(opt => (
                      <option key={opt.id} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => openAddLocationModal('section')}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 15px',
                      minWidth: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
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
        <div className="premium-card" style={{ marginBottom: '30px' }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '20px' }}>Device Type (Optional)</h2>
          </div>
          <div className="card-body">
            <p style={{
              marginBottom: '15px',
              color: 'var(--theme-text-secondary)',
              fontSize: '14px'
            }}>
              Select where these devices will be used. You can select multiple options.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                padding: '12px',
                border: '2px solid var(--theme-border)',
                borderRadius: '8px',
                background: deviceType.includes('Office Device') ? 'var(--theme-bg-secondary)' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <input
                  type="checkbox"
                  checked={deviceType.includes('Office Device')}
                  onChange={() => handleDeviceTypeToggle('Office Device')}
                  disabled={isSubmitting}
                  style={{
                    marginTop: '3px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    color: 'var(--theme-text-primary)',
                    marginBottom: '5px'
                  }}>
                    Office Device
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--theme-text-secondary)',
                    lineHeight: '1.5'
                  }}>
                    I understand that I will be responsible for any misuse or damages that may occur. I confirm that this device(s) will be used for work purpose only.
                  </div>
                </div>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                padding: '12px',
                border: '2px solid var(--theme-border)',
                borderRadius: '8px',
                background: deviceType.includes('Lab Device') ? 'var(--theme-bg-secondary)' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <input
                  type="checkbox"
                  checked={deviceType.includes('Lab Device')}
                  onChange={() => handleDeviceTypeToggle('Lab Device')}
                  disabled={isSubmitting}
                  style={{
                    marginTop: '3px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    color: 'var(--theme-text-primary)',
                    marginBottom: '5px'
                  }}>
                    Lab Device
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--theme-text-secondary)',
                    lineHeight: '1.5'
                  }}>
                    I understand that the lab supervisor shall monitor the lab devices to avoid any misuse or damage.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="premium-card" style={{ marginBottom: '30px' }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '20px' }}>Digital Signature</h2>
          </div>
          <div className="card-body">
            <p style={{
              marginBottom: '15px',
              color: 'var(--theme-text-secondary)',
              fontSize: '14px'
            }}>
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
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            className="btn-premium"
            onClick={handleSubmitSignature}
            disabled={isSubmitting || !isFormValid()}
            style={{ minWidth: '200px' }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-premium" style={{
                  width: '16px',
                  height: '16px',
                  marginRight: '8px'
                }}></span>
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
            className="btn-secondary"
            onClick={() => setShowDisputeModal(true)}
            disabled={isSubmitting}
            style={{ minWidth: '200px' }}
          >
            <i className="fas fa-exclamation-triangle"></i> Dispute Assets
          </button>
        </div>

        {/* Dispute Modal */}
        {showDisputeModal && (
          <div className="modal-overlay animate-fadeIn" onClick={() => !isSubmitting && setShowDisputeModal(false)}>
            <div className="modal-content animate-scaleIn" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <h2 style={{ margin: 0, fontSize: '20px' }}>Dispute Assets</h2>
              </div>
              <div className="card-body">
                <p style={{
                  marginBottom: '15px',
                  color: 'var(--theme-text-secondary)'
                }}>
                  Please explain why you are disputing the assigned assets. The administrator will review your concern and contact you.
                </p>
                <label htmlFor="disputeReason" style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-primary)'
                }}>
                  Dispute Reason <span style={{ color: 'var(--theme-danger)' }}>*</span>
                </label>
                <textarea
                  id="disputeReason"
                  className="input-premium"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Enter your reason for disputing..."
                  rows="5"
                  disabled={isSubmitting}
                  style={{ resize: 'vertical' }}
                ></textarea>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowDisputeModal(false)}
                    disabled={isSubmitting}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-premium"
                    onClick={handleSubmitDispute}
                    disabled={isSubmitting || !disputeReason.trim()}
                    style={{ flex: 1 }}
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
            <div className="modal-content animate-scaleIn" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <h2 style={{ margin: 0, fontSize: '20px' }}>
                  Add New {addLocationCategory === 'building' ? 'Building' : addLocationCategory === 'floor' ? 'Floor' : 'Section'}
                </h2>
              </div>
              <div className="card-body">
                <p style={{
                  marginBottom: '15px',
                  color: 'var(--theme-text-secondary)',
                  fontSize: '14px'
                }}>
                  Enter a new {addLocationCategory} option. It will be available for future use.
                </p>
                <label htmlFor="newLocationValue" style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--theme-text-primary)'
                }}>
                  {addLocationCategory === 'building' ? 'Building Name' : addLocationCategory === 'floor' ? 'Floor Name' : 'Section Name'} <span style={{ color: 'var(--theme-danger)' }}>*</span>
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
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddLocationModal(false)}
                    disabled={isAddingLocation}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-premium"
                    onClick={handleAddLocation}
                    disabled={isAddingLocation || !newLocationValue.trim()}
                    style={{ flex: 1 }}
                  >
                    {isAddingLocation ? (
                      <>
                        <span className="spinner-premium" style={{
                          width: '14px',
                          height: '14px',
                          marginRight: '6px'
                        }}></span>
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
