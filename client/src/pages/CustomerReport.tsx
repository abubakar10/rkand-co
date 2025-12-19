import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, DollarSign, ShoppingCart, TrendingUp, Image as ImageIcon, CreditCard, X, Download } from 'lucide-react'
import DateFilter, { DateFilterType } from '../components/DateFilter'
import { API_URL } from '../config/api'

interface Payment {
  _id: string
  amount: number
  notes?: string
  date: string
  allocatedOrders: Array<{
    orderId: string
    allocated: number
    previousPaid: number
    newPaid: number
    status: string
  }>
}

interface CustomerSummary {
  customerName: string
  totalOrders: number
  totalAmount: number
  totalPaid: number
  balance: number
  orders: Order[]
  payments?: Payment[]
}

interface Order {
  _id: string
  product: string
  liters?: number
  ratePerLitre?: number
  totalAmount: number
  paidAmount: number
  paymentStatus: 'paid' | 'unpaid' | 'partial'
  date: string
  imageUrl?: string
}

export default function CustomerReport() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all')
  const [filterStartDate, setFilterStartDate] = useState<string | undefined>()
  const [filterEndDate, setFilterEndDate] = useState<string | undefined>()
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('')
  const [allCustomers, setAllCustomers] = useState<CustomerSummary[]>([])
  const [customerNames, setCustomerNames] = useState<string[]>([])
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentCustomer, setPaymentCustomer] = useState<string>('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [dateFilter, filterStartDate, filterEndDate, selectedCustomerFilter, allCustomers])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {}
      const res = await axios.get(`${API_URL}/ledger/customers`, config)
      setAllCustomers(res.data.customers)
      setCustomerNames(res.data.customers.map((c: CustomerSummary) => c.customerName))
      applyFiltersToData(res.data.customers)
    } catch (err) {
      console.error('Failed to fetch customers', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersToData = (data: CustomerSummary[]) => {
    let filtered = [...data]

    // Apply customer filter
    if (selectedCustomerFilter) {
      filtered = filtered.filter(customer => customer.customerName === selectedCustomerFilter)
    }

    // Apply date filter to orders within each customer
    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate)
      const end = new Date(filterEndDate)
      filtered = filtered.map(customer => {
        const filteredOrders = customer.orders.filter(order => {
          const orderDate = new Date(order.date)
          return orderDate >= start && orderDate <= end
        })
        
        // Recalculate totals based on filtered orders
        const totalAmount = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        const totalPaid = filteredOrders.reduce((sum, order) => sum + (order.paidAmount || 0), 0)
        const balance = totalAmount - totalPaid

        return {
          ...customer,
          orders: filteredOrders,
          totalOrders: filteredOrders.length,
          totalAmount,
          totalPaid,
          balance
        }
      }).filter(customer => customer.orders.length > 0) // Remove customers with no orders in date range
    }

    setCustomers(filtered)
  }

  const applyFilters = () => {
    applyFiltersToData(allCustomers)
  }

  const handleFilterChange = (filter: DateFilterType, startDate?: string, endDate?: string) => {
    setDateFilter(filter)
    setFilterStartDate(startDate)
    setFilterEndDate(endDate)
  }

  const handleCustomerFilterChange = (customer: string) => {
    setSelectedCustomerFilter(customer)
  }

  const fetchCustomerDetails = async (customerName: string) => {
    try {
      const token = localStorage.getItem('token')
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {}
      const res = await axios.get(`${API_URL}/ledger/customers/${encodeURIComponent(customerName)}`, config)
      const customer = customers.find(c => c.customerName === customerName)
      if (customer) {
        setSelectedCustomer({ 
          ...customer, 
          orders: res.data.orders,
          payments: res.data.payments || []
        })
      }
    } catch (err) {
      console.error('Failed to fetch customer details', err)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'Rs 0.00'
    }
    return `Rs ${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    )
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentCustomer || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      setPaymentError('Please enter a valid customer and payment amount')
      return
    }

    setProcessingPayment(true)
    setPaymentError('')
    setPaymentSuccess('')

    try {
      const token = localStorage.getItem('token')
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {}

      const response = await axios.post(
        `${API_URL}/ledger/customers/${encodeURIComponent(paymentCustomer)}/payments`,
        {
          amount: parseFloat(paymentAmount),
          notes: paymentNotes,
        },
        config
      )

      if (response.data.warning) {
        setPaymentError(`Warning: ${response.data.message}`)
      } else {
        setPaymentSuccess(`Payment of Rs ${paymentAmount} allocated successfully across ${response.data.allocatedOrders} order(s)`)
        setPaymentAmount('')
        setPaymentNotes('')
        setShowPaymentForm(false)
      }
      
      // Refresh customer data
      await fetchCustomers()
      if (selectedCustomer?.customerName === paymentCustomer) {
        await fetchCustomerDetails(paymentCustomer)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to process payment'
      setPaymentError(errorMessage)
    } finally {
      setProcessingPayment(false)
    }
  }

  const openPaymentForm = (customerName: string) => {
    setPaymentCustomer(customerName)
    setPaymentAmount('')
    setPaymentNotes('')
    setPaymentError('')
    setPaymentSuccess('')
    setShowPaymentForm(true)
  }

  const handleDownloadPDF = async (customerName: string) => {
    try {
      const token = localStorage.getItem('token')
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob' as const
      } : { responseType: 'blob' as const }

      const response = await axios.get(
        `${API_URL}/ledger/customers/${encodeURIComponent(customerName)}/pdf`,
        config
      )

      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${customerName.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Failed to download PDF:', err)
      alert('Failed to download PDF. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Reports</h1>
          <p className="text-gray-600 mt-1">View detailed customer transaction history</p>
        </div>
        <button
          onClick={() => {
            setPaymentCustomer('')
            setPaymentAmount('')
            setPaymentNotes('')
            setPaymentError('')
            setPaymentSuccess('')
            setShowPaymentForm(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <CreditCard className="w-5 h-5" />
          <span>Record Payment</span>
        </button>
      </div>

      <DateFilter
        onFilterChange={handleFilterChange}
        showCustomerFilter={true}
        customers={customerNames}
        selectedCustomer={selectedCustomerFilter}
        onCustomerChange={handleCustomerFilterChange}
      />

      <div className="card">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full max-w-md"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.customerName} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.customerName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.totalOrders}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.totalAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.totalPaid)}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${
                      customer.balance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(customer.balance)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            if (selectedCustomer?.customerName === customer.customerName) {
                              setSelectedCustomer(null)
                            } else {
                              fetchCustomerDetails(customer.customerName)
                            }
                          }}
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          {selectedCustomer?.customerName === customer.customerName ? 'Hide' : 'View'} Details
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(customer.customerName)}
                          className="text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                          title="Download PDF report"
                        >
                          <Download className="w-4 h-4" />
                          <span>PDF</span>
                        </button>
                        {customer.balance > 0 && (
                          <button
                            onClick={() => openPaymentForm(customer.customerName)}
                            className="text-green-600 hover:text-green-800 transition-colors flex items-center space-x-1"
                            title="Record payment"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCustomer.customerName} - Detailed Report
              </h2>
              <button
                onClick={() => handleDownloadPDF(selectedCustomer.customerName)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{selectedCustomer.totalOrders}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Total Amount</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(selectedCustomer.totalAmount)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Total Paid</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(selectedCustomer.totalPaid)}</p>
              </div>
              <div className={`p-4 rounded-lg ${selectedCustomer.balance > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className={`w-5 h-5 ${selectedCustomer.balance > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                  <span className="text-sm font-medium text-gray-600">Balance</span>
                </div>
                <p className={`text-2xl font-bold ${selectedCustomer.balance > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                  {formatCurrency(selectedCustomer.balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Product Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const productSummary = selectedCustomer.orders.reduce((acc, order) => {
                    if (order.liters && order.product !== 'other') {
                      if (!acc[order.product]) {
                        acc[order.product] = { totalLiters: 0, orders: 0 }
                      }
                      acc[order.product].totalLiters += order.liters
                      acc[order.product].orders += 1
                    }
                    return acc
                  }, {} as Record<string, { totalLiters: number; orders: number }>)

                  const products = Object.entries(productSummary)
                  
                  if (products.length === 0) {
                    return (
                      <div className="col-span-full text-center text-gray-500 py-4">
                        No product quantity data available
                      </div>
                    )
                  }

                  return products.map(([product, data]) => (
                    <div key={product} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-600 capitalize mb-1">
                        {product}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {data.totalLiters.toFixed(2)}L
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {data.orders} order{data.orders !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedCustomer.orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {order.product}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.liters ? `${order.liters.toFixed(2)}L` : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.paidAmount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(order.paymentStatus)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {order.imageUrl ? (
                          <a
                            href={`${API_URL.replace('/api', '')}${order.imageUrl}`}
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

          {/* Payment History */}
          {selectedCustomer.payments && selectedCustomer.payments.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allocated Orders
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedCustomer.payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="space-y-1">
                            {payment.allocatedOrders.map((allocation, idx) => (
                              <div key={idx} className="text-xs">
                                Order: {formatCurrency(allocation.allocated)} allocated
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {payment.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Record Customer Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentForm(false)
                  setPaymentError('')
                  setPaymentSuccess('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-4 space-y-4">
              {paymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {paymentError}
                </div>
              )}
              {paymentSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {paymentSuccess}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                {paymentCustomer ? (
                  <input
                    type="text"
                    value={paymentCustomer}
                    disabled
                    className="input bg-gray-100"
                  />
                ) : (
                  <select
                    value={paymentCustomer}
                    onChange={(e) => setPaymentCustomer(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customerNames.map((name) => {
                      const customer = allCustomers.find(c => c.customerName === name)
                      if (customer && customer.balance > 0) {
                        return (
                          <option key={name} value={name}>
                            {name} (Balance: Rs {customer.balance.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })})
                          </option>
                        )
                      }
                      return null
                    })}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (Rs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input"
                  placeholder="0.00"
                  required
                />
                {paymentCustomer && (() => {
                  const customer = allCustomers.find(c => c.customerName === paymentCustomer)
                  if (customer && customer.balance > 0) {
                    return (
                      <p className="text-xs text-gray-500 mt-1">
                        Outstanding Balance: Rs {customer.balance.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Additional notes about this payment"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The payment will be automatically allocated across all unpaid orders for this customer, starting with the oldest order first.
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" disabled={processingPayment} className="btn btn-primary flex-1">
                  {processingPayment ? 'Processing...' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false)
                    setPaymentError('')
                    setPaymentSuccess('')
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


