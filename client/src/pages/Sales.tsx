import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, CheckCircle, XCircle, Clock, Image as ImageIcon, Edit2, X } from 'lucide-react'
import DateFilter, { DateFilterType } from '../components/DateFilter'
import { API_URL } from '../config/api'

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
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [updateData, setUpdateData] = useState({
    paymentStatus: 'unpaid' as 'paid' | 'unpaid' | 'partial',
    paidAmount: '',
    notes: '',
  })
  const [updateImage, setUpdateImage] = useState<File | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all')
  const [filterStartDate, setFilterStartDate] = useState<string | undefined>()
  const [filterEndDate, setFilterEndDate] = useState<string | undefined>()
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('')
  const [allSales, setAllSales] = useState<Sale[]>([])

  useEffect(() => {
    fetchSales()
    fetchCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [dateFilter, filterStartDate, filterEndDate, selectedCustomerFilter, allSales])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {}
      
      // Fetch from customers endpoint
      const customersRes = await axios.get(`${API_URL}/customers`, config)
      const customerNames = customersRes.data.customers.map((c: any) => c.name)
      
      // Also fetch from sales to get all unique customer names
      const salesRes = await axios.get(`${API_URL}/ledger/sales`, config)
      const saleCustomerNames = [...new Set(salesRes.data.sales.map((s: Sale) => s.customerName))]
      
      // Combine and remove duplicates
      const allCustomers = [...new Set([...customerNames, ...saleCustomerNames])].sort()
      setCustomers(allCustomers)
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
      setCustomerSuggestions(filtered.slice(0, 10)) // Show up to 10 suggestions
      setShowSuggestions(filtered.length > 0 && value.trim().length > 0)
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
      setAllSales(res.data.sales)
      applyFiltersToData(res.data.sales)
    } catch (err) {
      console.error('Failed to fetch sales', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersToData = (data: Sale[]) => {
    let filtered = [...data]

    // Apply date filter
    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate)
      const end = new Date(filterEndDate)
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date)
        return saleDate >= start && saleDate <= end
      })
    }

    // Apply customer filter
    if (selectedCustomerFilter) {
      filtered = filtered.filter(sale => sale.customerName === selectedCustomerFilter)
    }

    setSales(filtered)
  }

  const applyFilters = () => {
    applyFiltersToData(allSales)
  }

  const handleFilterChange = (filter: DateFilterType, startDate?: string, endDate?: string) => {
    setDateFilter(filter)
    setFilterStartDate(startDate)
    setFilterEndDate(endDate)
  }

  const handleCustomerFilterChange = (customer: string) => {
    setSelectedCustomerFilter(customer)
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

      await axios.post(`${API_URL}/ledger/sales`, formDataToSend, {
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

  const calculateBalance = (sale: Sale) => {
    const total = totalAmount(sale)
    const paid = sale.paidAmount || 0
    return total - paid
  }

  const handleUpdateClick = (sale: Sale) => {
    setEditingSale(sale)
    setUpdateData({
      paymentStatus: sale.paymentStatus,
      paidAmount: sale.paidAmount?.toString() || '',
      notes: '',
    })
    setUpdateImage(null)
    setUpdateError('')
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSale) return

    setUpdating(true)
    setUpdateError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('paymentStatus', updateData.paymentStatus)
      if (updateData.paidAmount) {
        formDataToSend.append('paidAmount', updateData.paidAmount)
      }
      if (updateData.notes) {
        formDataToSend.append('notes', updateData.notes)
      }
      if (updateImage) {
        formDataToSend.append('image', updateImage)
      }

      await axios.put(`${API_URL}/ledger/sales/${editingSale._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      await fetchSales()
      setEditingSale(null)
      setUpdateData({
        paymentStatus: 'unpaid',
        paidAmount: '',
        notes: '',
      })
      setUpdateImage(null)
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to update sale'
      setUpdateError(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

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

      <DateFilter
        onFilterChange={handleFilterChange}
        showCustomerFilter={true}
        customers={customers}
        selectedCustomer={selectedCustomerFilter}
        onCustomerChange={handleCustomerFilterChange}
      />

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
                    } else if (customers.length > 0) {
                      // Show all customers when focused and empty
                      setCustomerSuggestions(customers.slice(0, 10))
                      setShowSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                  required
                  className="input"
                  placeholder="Type to search customers..."
                  autoComplete="off"
                />
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {customerSuggestions.map((customer) => (
                      <div
                        key={customer}
                        onClick={() => selectCustomer(customer)}
                        onMouseDown={(e) => e.preventDefault()} // Prevent input blur on click
                        className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <span className="text-gray-900">{customer}</span>
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
                    Paid
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rs {(sale.paidAmount || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {(() => {
                        const balance = calculateBalance(sale)
                        const isPaid = balance <= 0
                        return (
                          <span className={`text-sm font-medium ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                            Rs {balance.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            {isPaid ? ' (Paid)' : ' (Unpaid)'}
                          </span>
                        )
                      })()}
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleUpdateClick(sale)}
                        className="text-primary-600 hover:text-primary-800 transition-colors flex items-center space-x-1"
                        title="Update payment"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-xs">Update</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update Sale Modal */}
      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Update Payment</h2>
              <button
                onClick={() => {
                  setEditingSale(null)
                  setUpdateError('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-4 space-y-4">
              {updateError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {updateError}
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Customer:</span> {editingSale.customerName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Total Amount:</span> Rs {totalAmount(editingSale).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Current Status:</span> <span className="capitalize">{editingSale.paymentStatus}</span>
                  {editingSale.paidAmount && (
                    <span className="ml-2">(Paid: Rs {editingSale.paidAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })})</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={updateData.paymentStatus}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
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
              {updateData.paymentStatus !== 'unpaid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid Amount (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={updateData.paidAmount}
                    onChange={(e) => setUpdateData({ ...updateData, paidAmount: e.target.value })}
                    className="input"
                    placeholder="0.00"
                    max={totalAmount(editingSale)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: Rs {totalAmount(editingSale).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Image (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUpdateImage(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {updateImage && (
                    <span className="text-sm text-gray-600">{updateImage.name}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" disabled={updating} className="btn btn-primary flex-1">
                  {updating ? 'Updating...' : 'Update Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSale(null)
                    setUpdateError('')
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

