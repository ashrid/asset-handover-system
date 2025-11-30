import { useState, useEffect } from 'react'

function AssetForm({ asset, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    asset_code: '',
    asset_type: '',
    description: '',
    model: '',
    serial_number: '',
    asset_category_1: '',
    asset_category_2: '',
    asset_category_3: '',
    asset_category_4: '',
    asset_location_1: '',
    asset_location_2: '',
    asset_location_3: '',
    asset_location_4: '',
    status: '',
    unit_cost: '',
    warranty_start_date: '',
    supplier_vendor: '',
    manufacturer: '',
    lpo_voucher_no: '',
    invoice_no: ''
  })

  useEffect(() => {
    if (asset) {
      setFormData(asset)
    }
  }, [asset])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slideUp">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Asset Code <span className="text-danger">*</span>
          </label>
          <input
            className="input-premium"
            type="text"
            name="asset_code"
            value={formData.asset_code}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Asset Type <span className="text-danger">*</span>
          </label>
          <input
            className="input-premium"
            type="text"
            name="asset_type"
            value={formData.asset_type}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-text-primary">
          Description
        </label>
        <textarea
          className="textarea-premium"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Model
          </label>
          <input
            className="input-premium"
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Serial Number
          </label>
          <input
            className="input-premium"
            type="text"
            name="serial_number"
            value={formData.serial_number}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="section-divider mt-8">
        <h3 className="text-xl font-bold gradient-text">Asset Categories</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(level => (
          <div key={level}>
            <label className="block text-sm font-semibold mb-2 text-text-primary">
              Category Level {level}
            </label>
            <input
              className="input-premium"
              type="text"
              name={`asset_category_${level}`}
              value={formData[`asset_category_${level}`]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      <div className="section-divider mt-8">
        <h3 className="text-xl font-bold gradient-text">Asset Locations</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(level => (
          <div key={level}>
            <label className="block text-sm font-semibold mb-2 text-text-primary">
              Location Level {level}
            </label>
            <input
              className="input-premium"
              type="text"
              name={`asset_location_${level}`}
              value={formData[`asset_location_${level}`]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      <div className="section-divider mt-8">
        <h3 className="text-xl font-bold gradient-text">Additional Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="select-premium"
          >
            <option value="">Select Status</option>
            <option value="Active">Active</option>
            <option value="Sold">Sold</option>
            <option value="Lost">Lost</option>
            <option value="Broken">Broken</option>
            <option value="Under Maintenance">Under Maintenance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Unit Cost
          </label>
          <input
            className="input-premium"
            type="number"
            step="0.01"
            name="unit_cost"
            value={formData.unit_cost}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Warranty Start Date
          </label>
          <input
            className="input-premium"
            type="date"
            name="warranty_start_date"
            value={formData.warranty_start_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Supplier / Vendor
          </label>
          <input
            className="input-premium"
            type="text"
            name="supplier_vendor"
            value={formData.supplier_vendor}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Manufacturer
          </label>
          <input
            className="input-premium"
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            LPO / Voucher No.
          </label>
          <input
            className="input-premium"
            type="text"
            name="lpo_voucher_no"
            value={formData.lpo_voucher_no}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            Invoice No.
          </label>
          <input
            className="input-premium"
            type="text"
            name="invoice_no"
            value={formData.invoice_no}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-premium"
        >
          {asset ? 'Update Asset' : 'Create Asset'}
        </button>
      </div>
    </form>
  )
}

export default AssetForm
