import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'

function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState([])
  const [errors, setErrors] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const requiredColumns = ['asset_code', 'asset_type']
  const templateHeaders = [
    'asset_code', 'asset_type', 'description', 'model', 'serial_number',
    'asset_category_1', 'asset_category_2', 'asset_category_3', 'asset_category_4',
    'asset_location_1', 'asset_location_2', 'asset_location_3', 'asset_location_4',
    'status', 'unit_cost', 'warranty_start_date', 'supplier_vendor', 'manufacturer', 'lpo_voucher_no', 'invoice_no'
  ]

  const resetState = useCallback(() => {
    setFile(null)
    setParsedData([])
    setErrors([])
    setIsLoading(false)
  }, [])

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseExcel(selectedFile)
    }
  }

  const parseExcel = (fileToParse) => {
    setIsLoading(true)
    setErrors([])
    setParsedData([])

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const validationErrors = []
        const validatedData = jsonData.map((row, index) => {
          for (const col of requiredColumns) {
            if (!row[col]) {
              validationErrors.push(`Row ${index + 2}: Missing required field '${col}'`)
            }
          }
          return row
        })

        if (validationErrors.length > 0) {
          setErrors(validationErrors)
          setParsedData([])
        } else {
          setParsedData(validatedData)
          setErrors([])
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error)
        setErrors(['Failed to parse the Excel file. Please ensure it is a valid .xlsx or .xls file.'])
      } finally {
        setIsLoading(false)
      }
    }
    reader.onerror = () => {
      setIsLoading(false)
      setErrors(['Error reading the file.'])
    }
    reader.readAsArrayBuffer(fileToParse)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      parseExcel(droppedFile)
    }
  }

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([{}], { header: templateHeaders })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets Template')
    XLSX.writeFile(workbook, 'Asset_Import_Template.xlsx')
  }

  const handleImport = () => {
    if (errors.length === 0 && parsedData.length > 0) {
      onImportSuccess(parsedData)
      handleClose()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="modal-overlay animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="modal-content animate-scaleIn w-full max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border">
          <h2 className="text-xl font-bold gradient-text">
            <i className="fas fa-file-excel mr-2"></i>
            Import Assets from Excel
          </h2>
          <button
            onClick={handleClose}
            className="text-3xl font-bold leading-none opacity-50 hover:opacity-100 transition-opacity text-text-primary"
            aria-label="close"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* File Upload Section */}
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-background)',
              cursor: 'pointer'
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="spinner-premium"></div>
                <p className="mt-4 text-text-secondary">Parsing Excel file...</p>
              </div>
            ) : file ? (
              <div className="animate-fadeIn">
                <i className="fas fa-file-excel text-5xl mb-4" style={{ color: 'var(--theme-success)' }}></i>
                <p className="text-lg font-semibold text-text-primary">{file.name}</p>
                <p className="text-sm text-text-secondary mt-2">Drag & drop another file or click to replace</p>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <i className="fas fa-upload text-5xl mb-4 text-text-light"></i>
                <p className="text-lg font-semibold text-text-primary">Drag & drop your Excel file here</p>
                <p className="text-sm text-text-secondary mt-2">or click to browse (.xlsx, .xls)</p>
              </div>
            )}
          </div>

          {/* Template Download Button */}
          <div className="flex justify-end mt-4">
            <button onClick={handleDownloadTemplate} className="btn-secondary flex items-center gap-2">
              <i className="fas fa-download"></i>
              <span>Download Template</span>
            </button>
          </div>

          <div className="section-divider mt-6">
            <h3 className="text-lg font-bold gradient-text">Preview & Validation</h3>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="notification-premium notification-danger mt-4 animate-slideUp">
              <i className="fas fa-exclamation-triangle text-xl"></i>
              <div className="flex-1">
                <h4 className="font-bold mb-2">Validation Errors Found</h4>
                <ul className="list-disc pl-5">
                  {errors.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {errors.length > 10 && (
                    <li className="font-semibold">...and {errors.length - 10} more errors.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Data Preview */}
          {parsedData.length > 0 && errors.length === 0 && (
            <div className="mt-4 animate-slideUp">
              <div className="notification-premium notification-success mb-4">
                <i className="fas fa-check-circle text-xl"></i>
                <span className="flex-1">
                  Found <strong>{parsedData.length}</strong> valid asset{parsedData.length !== 1 ? 's' : ''} ready to import
                </span>
              </div>

              <h4 className="font-semibold mb-3 text-text-primary">Data Preview (First 10 Rows)</h4>
              <div className="overflow-x-auto">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Asset Code</th>
                      <th>Asset Type</th>
                      <th>Description</th>
                      <th>Model</th>
                      <th>Status</th>
                      <th>Serial Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        <td><strong className="text-text-primary">{row.asset_code || '-'}</strong></td>
                        <td className="text-text-secondary">{row.asset_type || '-'}</td>
                        <td className="text-text-secondary">{row.description || '-'}</td>
                        <td className="text-text-secondary">{row.model || '-'}</td>
                        <td>
                          {row.status ? (
                            <span className={`badge-premium whitespace-nowrap ${
                              row.status === 'Active' ? 'badge-success' :
                              row.status === 'Broken' ? 'badge-danger' :
                              'badge-info'
                            }`}>
                              {row.status}
                            </span>
                          ) : (
                            <span className="text-text-light">-</span>
                          )}
                        </td>
                        <td className="text-text-secondary">{row.serial_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 10 && (
                <p className="text-sm text-text-secondary mt-2">
                  Showing 10 of {parsedData.length} records
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border">
          <button onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleImport}
            className={`btn-premium flex items-center gap-2 ${
              isLoading || errors.length > 0 || parsedData.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            disabled={isLoading || errors.length > 0 || parsedData.length === 0}
          >
            <i className="fas fa-file-import"></i>
            <span>
              Import {parsedData.length > 0 ? `${parsedData.length} Asset${parsedData.length !== 1 ? 's' : ''}` : 'Assets'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExcelImportModal
