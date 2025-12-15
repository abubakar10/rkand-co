import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface Sale {
  _id: string
  customerName: string
  product: string
  liters?: number
  ratePerLitre?: number
  totalAmount: number
  imageUrl?: string
  paymentStatus: 'paid' | 'unpaid' | 'partial'
  paidAmount?: number
  date: string
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    product: 'petrol',
    liters: '',
    ratePerLitre: '',
    totalAmount: '',
    paymentStatus: 'unpaid' as 'paid' | 'unpaid' | 'partial',
    paidAmount: '',
    notes: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<string[]>([])
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    fetchSales()
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {}
      const res = await axios.get(`${API_URL}/customers`, config)
      setCustomers(res.data.customers.map((c: any) => c.name))
    } catch (err) {
      console.error('Failed to fetch customers', err)
    }
  }

  const handleCustomerInputChange = (value: string) => {
    setFormData({ ...formData, customerName: value })
    if (value.trim()) {
      const filtered = customers.filter(c => 
        c.toLowerCase().includes(value.toLowerCase())
      )
      setCustomerSuggestions(filtered.slice(0, 5))
      setShowSuggestions(filtered.length > 0)
    } else {
      setCustomerSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectCustomer = (name: string) => {
    setFormData({ ...formData, customerName: name })
    setShowSuggestions(false)
  }

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_URL}/ledger/sales`)
      setSales(res.data.sales)
    } catch (err) {
      console.error('Failed to fetch sales', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('customerName', formData.customerName.trim())
      formDataToSend.append('product', formData.product)
      
      if (formData.product === 'other') {
        if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
          alert('Please enter a valid total amount')
          setSubmitting(false)
          return
        }
        formDataToSend.append('totalAmount', formData.totalAmount)
      } else {
        if (!formData.liters || parseFloat(formData.liters) <= 0) {
          alert('Please enter valid liters')
          setSubmitting(false)
          return
        }
        if (!formData.ratePerLitre || parseFloat(formData.ratePerLitre) <= 0) {
          alert('Please enter valid rate per litre')
          setSubmitting(false)
          return
        }
        formDataToSend.append('liters', formData.liters)
        formDataToSend.append('ratePerLitre', formData.ratePerLitre)
      }
      
      formDataToSend.append('paymentStatus', formData.paymentStatus)
      if (formData.paidAmount && formData.paidAmount.trim() !== '') {
        formDataToSend.append('paidAmount', formData.paidAmount)
      }
      if (formData.notes && formData.notes.trim() !== '') {
        formDataToSend.append('notes', formData.notes)
      }
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      const response = await axios.post(`${API_URL}/ledger/sales`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      await fetchSales()
      setShowForm(false)
      setFormData({
        customerName: '',
        product: 'petrol',
        liters: '',
        ratePerLitre: '',
        totalAmount: '',
        paymentStatus: 'unpaid',
        paidAmount: '',
        notes: '',
      })
      setImageFile(null)
    } catch (err: any) {
      console.error('Sale creation error:', err.response?.data)
      const errorMsg = err.response?.data?.errors?.[0]?.msg || 
                      err.response?.data?.message || 
                      err.message || 
                      'Failed to create sale'
      alert(`Error: ${errorMsg}`)
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

  const totalAmount = (sale: Sale) => sale.totalAmount || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600 mt-1">Track sales to customers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Sale</span>
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">New Sale</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleCustomerInputChange(e.target.value)}
                  onFocus={() => {
                    if (formData.customerName.trim()) {
                      handleCustomerInputChange(formData.customerName)
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                  required
                  className="input"
                  placeholder="Enter customer name"
                  list="customer-list"
                />
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {customerSuggestions.map((customer) => (
                      <div
                        key={customer}
                        onClick={() => selectCustomer(customer)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {customer}
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
                  Upload Image (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {imageFile && (
                    <span className="text-sm text-gray-600">{imageFile.name}</span>
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
                {submitting ? 'Adding...' : 'Add Sale'}
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
      ) : sales.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No sales found</p>
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
                    Customer
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
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.customerName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.product}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.liters ? `${sale.liters.toFixed(2)}L` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.ratePerLitre ? `Rs ${sale.ratePerLitre.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rs {totalAmount(sale).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {sale.imageUrl ? (
                        <a
                          href={`${API_URL.replace('/api', '')}${sale.imageUrl}`}
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(sale.paymentStatus)}
                        <span className="text-sm text-gray-900 capitalize">
                          {sale.paymentStatus}
                        </span>
                      </div>
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

