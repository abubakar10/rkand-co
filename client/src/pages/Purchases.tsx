import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface Purchase {
  _id: string
  supplierName: string
  product: string
  liters?: number
  ratePerLitre?: number
  totalAmount: number
  paymentStatus: 'paid' | 'unpaid' | 'partial'
  paidAmount?: number
  depositSlipUrl?: string
  date: string
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    supplierName: '',
    product: 'petrol',
    liters: '',
    ratePerLitre: '',
    totalAmount: '',
    paymentStatus: 'unpaid' as 'paid' | 'unpaid' | 'partial',
    paidAmount: '',
    notes: '',
  })
  const [depositSlip, setDepositSlip] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [supplierSuggestions, setSupplierSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    fetchPurchases()
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {}
      
      // Fetch from suppliers endpoint
      const suppliersRes = await axios.get(`${API_URL}/suppliers`, config)
      const supplierNames = suppliersRes.data.suppliers.map((s: any) => s.name)
      
      // Also fetch from purchases to get all unique supplier names
      const purchasesRes = await axios.get(`${API_URL}/ledger/purchases`, config)
      const purchaseSupplierNames = [...new Set(purchasesRes.data.purchases.map((p: Purchase) => p.supplierName))]
      
      // Combine and remove duplicates
      const allSuppliers = [...new Set([...supplierNames, ...purchaseSupplierNames])].sort()
      setSuppliers(allSuppliers)
    } catch (err) {
      console.error('Failed to fetch suppliers', err)
    }
  }

  const handleSupplierInputChange = (value: string) => {
    setFormData({ ...formData, supplierName: value })
    if (value.trim()) {
      const filtered = suppliers.filter(s => 
        s.toLowerCase().includes(value.toLowerCase())
      )
      setSupplierSuggestions(filtered.slice(0, 10)) // Show up to 10 suggestions
      setShowSuggestions(filtered.length > 0 && value.trim().length > 0)
    } else {
      setSupplierSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSupplier = (name: string) => {
    setFormData({ ...formData, supplierName: name })
    setShowSuggestions(false)
  }

  const fetchPurchases = async () => {
    try {
      const res = await axios.get(`${API_URL}/ledger/purchases`)
      setPurchases(res.data.purchases)
    } catch (err) {
      console.error('Failed to fetch purchases', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('supplierName', formData.supplierName)
      formDataToSend.append('product', formData.product)
      
      if (formData.product === 'other') {
        formDataToSend.append('totalAmount', formData.totalAmount)
      } else {
        formDataToSend.append('liters', formData.liters)
        formDataToSend.append('ratePerLitre', formData.ratePerLitre)
      }
      
      formDataToSend.append('paymentStatus', formData.paymentStatus)
      if (formData.paidAmount) {
        formDataToSend.append('paidAmount', formData.paidAmount)
      }
      if (formData.notes) {
        formDataToSend.append('notes', formData.notes)
      }
      if (depositSlip) {
        formDataToSend.append('depositSlip', depositSlip)
      }

      await axios.post(`${API_URL}/ledger/purchases`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      await fetchPurchases()
      setShowForm(false)
      setFormData({
        supplierName: '',
        product: 'petrol',
        liters: '',
        ratePerLitre: '',
        totalAmount: '',
        paymentStatus: 'unpaid',
        paidAmount: '',
        notes: '',
      })
      setDepositSlip(null)
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to create purchase'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const calculateTotal = () => {
    if (formData.product === 'other') {
      return formData.totalAmount ? parseFloat(formData.totalAmount) : 0
    }
    const liters = parseFloat(formData.liters) || 0
    const rate = parseFloat(formData.ratePerLitre) || 0
    return liters * rate
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'unpaid':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'partial':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const totalAmount = (p: Purchase) => p.totalAmount || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
          <p className="text-gray-600 mt-1">Track purchases from suppliers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Purchase</span>
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">New Purchase</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => handleSupplierInputChange(e.target.value)}
                  onFocus={() => {
                    if (formData.supplierName.trim()) {
                      handleSupplierInputChange(formData.supplierName)
                    } else if (suppliers.length > 0) {
                      // Show all suppliers when focused and empty
                      setSupplierSuggestions(suppliers.slice(0, 10))
                      setShowSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                  required
                  className="input"
                  placeholder="Type to search suppliers..."
                  autoComplete="off"
                />
                {showSuggestions && supplierSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {supplierSuggestions.map((supplier) => (
                      <div
                        key={supplier}
                        onClick={() => selectSupplier(supplier)}
                        onMouseDown={(e) => e.preventDefault()} // Prevent input blur on click
                        className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <span className="text-gray-900">{supplier}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value, liters: '', ratePerLitre: '', totalAmount: '' })}
                  className="input"
                >
                  <option value="petrol">Petrol</option>
                  <option value="hi-octane">Hi-Octane</option>
                  <option value="diesel">Diesel</option>
                  <option value="mobile oil">Mobile Oil</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {formData.product === 'other' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    required
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Liters</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.liters}
                      onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                      required
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate per Litre (Rs)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ratePerLitre}
                      onChange={(e) => setFormData({ ...formData, ratePerLitre: e.target.value })}
                      required
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}
              {formData.product !== 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (Rs) <span className="text-xs text-gray-500">(Auto-calculated)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculateTotal().toFixed(2)}
                    disabled
                    className="input bg-gray-100"
                    placeholder="Auto-calculated"
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Slip Image (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDepositSlip(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {depositSlip && (
                    <span className="text-sm text-gray-600">{depositSlip.name}</span>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Additional notes (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentStatus: e.target.value as 'paid' | 'unpaid' | 'partial',
                    })
                  }
                  className="input"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partially Paid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              {formData.paymentStatus !== 'unpaid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid Amount (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Adding...' : 'Add Purchase'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : purchases.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No purchases found</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liters
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deposit Slip
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(purchase.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {purchase.supplierName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.product}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.liters ? `${purchase.liters.toFixed(2)}L` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.ratePerLitre ? `Rs ${purchase.ratePerLitre.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rs {totalAmount(purchase).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(purchase.paymentStatus)}
                        <span className="text-sm text-gray-900 capitalize">
                          {purchase.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {purchase.depositSlipUrl ? (
                        <a
                          href={`${API_URL.replace('/api', '')}${purchase.depositSlipUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

