import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import StatusFilter from './StatusFilter'
import DateRangePicker from './DateRangePicker'
import FilterChips from './FilterChips'
import SavedPresets from './SavedPresets'
import ExportButton from './ExportButton'

/**
 * SearchFilterPanel Component
 * Main search and filter panel with collapsible advanced filters
 */
function SearchFilterPanel({
  assignments,
  filteredAssignments,
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [departments, setDepartments] = useState([])

  // Extract unique departments from assignments
  useEffect(() => {
    const uniqueDepts = [...new Set(
      assignments
        .map(a => a.office_college)
        .filter(d => d && d.trim() !== '')
    )].sort()
    setDepartments(uniqueDepts)
  }, [assignments])

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters }
    if (key === 'statuses') {
      newFilters.statuses = []
    } else {
      newFilters[key] = null
    }
    onFiltersChange(newFilters)
  }

  const handleClearAllFilters = () => {
    onFiltersChange({
      statuses: [],
      dateFrom: null,
      dateTo: null,
      assetCountMin: null,
      assetCountMax: null,
      department: null,
      reminderStatus: null
    })
    onSearchChange('')
  }

  const handleApplyPreset = (presetFilters) => {
    onFiltersChange(presetFilters)
  }

  return (
    <div className="mb-6">
      {/* Global Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search by ID, employee name, email, office/college, asset codes, date, or status..."
          className="input-premium pl-10 pr-20"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light"></i>
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light hover:text-text-primary transition-colors"
            title="Clear search"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <i className="fas fa-filter"></i>
            <span>Advanced Filters</span>
            <i className={`fas fa-chevron-${showAdvanced ? 'up' : 'down'}`}></i>
          </button>

          <SavedPresets
            currentFilters={filters}
            onApplyPreset={handleApplyPreset}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-text-secondary">
            Showing <strong>{filteredAssignments.length}</strong> of <strong>{assignments.length}</strong> assignments
          </div>
          <ExportButton
            assignments={filteredAssignments}
            disabled={filteredAssignments.length === 0}
          />
        </div>
      </div>

      {/* Active Filters Chips */}
      <FilterChips
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="p-6 bg-hover-bg rounded-lg border border-border animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <i className="fas fa-check-circle mr-2"></i>
                Status
              </label>
              <StatusFilter
                selectedStatuses={filters.statuses}
                onChange={(statuses) => handleFilterChange('statuses', statuses)}
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <i className="fas fa-building mr-2"></i>
                Office/College
              </label>
              <select
                className="input-premium w-full"
                value={filters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value || null)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Reminder Status Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <i className="fas fa-bell mr-2"></i>
                Reminder Status
              </label>
              <select
                className="input-premium w-full"
                value={filters.reminderStatus || ''}
                onChange={(e) => handleFilterChange('reminderStatus', e.target.value || null)}
              >
                <option value="">All Reminders</option>
                <option value="none">No Reminders</option>
                <option value="few">1-2 Reminders</option>
                <option value="many">3-4 Reminders</option>
                <option value="max">Max Reminders (4)</option>
              </select>
            </div>

            {/* Asset Count Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <i className="fas fa-boxes mr-2"></i>
                Asset Count Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  className="input-premium w-full"
                  value={filters.assetCountMin || ''}
                  onChange={(e) => handleFilterChange('assetCountMin', e.target.value ? parseInt(e.target.value) : null)}
                />
                <span className="text-text-light">-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  className="input-premium w-full"
                  value={filters.assetCountMax || ''}
                  onChange={(e) => handleFilterChange('assetCountMax', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <i className="fas fa-calendar-alt mr-2"></i>
                Assigned Date Range
              </label>
              <DateRangePicker
                startDate={filters.dateFrom}
                endDate={filters.dateTo}
                onStartDateChange={(date) => handleFilterChange('dateFrom', date)}
                onEndDateChange={(date) => handleFilterChange('dateTo', date)}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <i className="fas fa-undo"></i>
              <span>Reset All Filters</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

SearchFilterPanel.propTypes = {
  assignments: PropTypes.array.isRequired,
  filteredAssignments: PropTypes.array.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired
}

export default SearchFilterPanel
