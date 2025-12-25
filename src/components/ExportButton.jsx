import { useState } from 'react'
import PropTypes from 'prop-types'
import * as XLSX from 'xlsx'

/**
 * ExportButton Component
 * Exports filtered assignments to Excel or CSV format
 */
function ExportButton({ assignments, disabled }) {
  const [isOpen, setIsOpen] = useState(false)

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

  const getStatusText = (assignment) => {
    if (assignment.is_signed) return 'Signed'
    if (assignment.is_disputed) return 'Disputed'
    if (assignment.pdf_sent) return 'Sent'
    return 'Pending'
  }

  const prepareExportData = () => {
    return assignments.map(assignment => ({
      'Assignment ID': assignment.id,
      'Employee Name': assignment.employee_name || '',
      'Employee ID': assignment.employee_id || '',
      'Email': assignment.email || '',
      'Office/College': assignment.office_college || '',
      'Asset Count': assignment.asset_codes ? assignment.asset_codes.split(',').length : 0,
      'Asset Codes': assignment.asset_codes || '',
      'Status': getStatusText(assignment),
      'Assigned Date': formatDateTime(assignment.assigned_at),
      'Signature Date': formatDateTime(assignment.signature_date),
      'Signed By': assignment.signed_by_email || '',
      'Backup Signer': assignment.signed_by_email && assignment.signed_by_email !== assignment.email ? 'Yes' : 'No',
      'Token Expires At': formatDateTime(assignment.token_expires_at),
      'Reminder Count': assignment.reminder_count || 0,
      'Is Disputed': assignment.is_disputed ? 'Yes' : 'No'
    }))
  }

  const exportToExcel = () => {
    const data = prepareExportData()
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Assignment ID
      { wch: 25 }, // Employee Name
      { wch: 15 }, // Employee ID
      { wch: 30 }, // Email
      { wch: 25 }, // Office/College
      { wch: 12 }, // Asset Count
      { wch: 40 }, // Asset Codes
      { wch: 12 }, // Status
      { wch: 20 }, // Assigned Date
      { wch: 20 }, // Signature Date
      { wch: 30 }, // Signed By
      { wch: 15 }, // Backup Signer
      { wch: 20 }, // Token Expires At
      { wch: 15 }, // Reminder Count
      { wch: 12 }  // Is Disputed
    ]
    worksheet['!cols'] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assignments')

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `assignments_${timestamp}.xlsx`

    XLSX.writeFile(workbook, filename)
    setIsOpen(false)
  }

  const exportToCSV = () => {
    const data = prepareExportData()
    const worksheet = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(worksheet)

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `assignments_${timestamp}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="btn-premium inline-flex items-center gap-2"
        title="Export filtered results"
      >
        <i className="fas fa-file-export"></i>
        <span>Export</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 right-0 mt-2 w-48 bg-card-bg border border-border rounded-lg shadow-lg">
          <button
            type="button"
            onClick={exportToExcel}
            className="w-full text-left px-4 py-3 hover:bg-hover-bg transition-colors flex items-center gap-3"
          >
            <i className="fas fa-file-excel" style={{ color: 'var(--theme-success)' }}></i>
            <div>
              <div className="font-medium text-text-primary">Excel (.xlsx)</div>
              <div className="text-xs text-text-light">Formatted spreadsheet</div>
            </div>
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            className="w-full text-left px-4 py-3 hover:bg-hover-bg transition-colors flex items-center gap-3 border-t border-border"
          >
            <i className="fas fa-file-csv" style={{ color: 'var(--theme-info)' }}></i>
            <div>
              <div className="font-medium text-text-primary">CSV (.csv)</div>
              <div className="text-xs text-text-light">Universal format</div>
            </div>
          </button>
        </div>
        </>
      )}

      {disabled && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-1 text-white text-xs rounded whitespace-nowrap pointer-events-none" style={{ backgroundColor: 'var(--theme-textPrimary)' }}>
          No data to export
        </div>
      )}
    </div>
  )
}

ExportButton.propTypes = {
  assignments: PropTypes.array.isRequired,
  disabled: PropTypes.bool
}

export default ExportButton
