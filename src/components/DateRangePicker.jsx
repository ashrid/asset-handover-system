import { useState } from 'react'
import PropTypes from 'prop-types'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

/**
 * DateRangePicker Component
 * Allows users to select a date range or use quick presets
 */
function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  const [showPresets, setShowPresets] = useState(false)

  const presets = [
    {
      label: 'Today',
      getRange: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return { start: today, end: new Date() }
      }
    },
    {
      label: 'Last 7 Days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 7)
        return { start, end }
      }
    },
    {
      label: 'Last 30 Days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 30)
        return { start, end }
      }
    },
    {
      label: 'Last 90 Days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 90)
        return { start, end }
      }
    },
    {
      label: 'This Month',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date()
        return { start, end }
      }
    },
    {
      label: 'Last Month',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        return { start, end }
      }
    }
  ]

  const handlePresetClick = (preset) => {
    const { start, end } = preset.getRange()
    onStartDateChange(start)
    onEndDateChange(end)
    setShowPresets(false)
  }

  const handleClear = () => {
    onStartDateChange(null)
    onEndDateChange(null)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            From Date
          </label>
          <DatePicker
            selected={startDate}
            onChange={onStartDateChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={endDate || new Date()}
            placeholderText="Select start date"
            className="input-premium w-full"
            dateFormat="dd-MMM-yyyy"
            isClearable
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            To Date
          </label>
          <DatePicker
            selected={endDate}
            onChange={onEndDateChange}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={new Date()}
            placeholderText="Select end date"
            className="input-premium w-full"
            dateFormat="dd-MMM-yyyy"
            isClearable
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="btn-secondary w-full flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <i className="fas fa-calendar-alt"></i>
            <span>Quick Presets</span>
          </span>
          <i className={`fas fa-chevron-${showPresets ? 'up' : 'down'}`}></i>
        </button>

        {showPresets && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPresets(false)}
            />

            {/* Dropdown */}
            <div className="absolute z-20 w-full mt-1 bg-card-bg border border-border rounded-lg shadow-lg">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="w-full text-left px-4 py-2 hover:bg-hover-bg transition-colors text-text-secondary"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Clear Button */}
      {(startDate || endDate) && (
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-danger hover:underline flex items-center gap-1"
        >
          <i className="fas fa-times-circle"></i>
          <span>Clear Date Range</span>
        </button>
      )}
    </div>
  )
}

DateRangePicker.propTypes = {
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  onStartDateChange: PropTypes.func.isRequired,
  onEndDateChange: PropTypes.func.isRequired
}

export default DateRangePicker
