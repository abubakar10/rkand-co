import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, DollarSign, ShoppingCart, TrendingUp, Image as ImageIcon } from 'lucide-react'
import DateFilter, { DateFilterType } from '../components/DateFilter'
import { API_URL } from '../config/api'

interface CustomerSummary {
  customerName: string
  totalOrders: number
  totalAmount: number
  totalPaid: number
  balance: number
  orders: Order[]
}

interface Order {
  _id: string
  product: string
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
        setSelectedCustomer({ ...customer, orders: res.data.orders })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Reports</h1>
          <p className="text-gray-600 mt-1">View detailed customer transaction history</p>
        </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedCustomer.customerName} - Detailed Report
            </h2>
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
        </div>
      )}
    </div>
  )
}


