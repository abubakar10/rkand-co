import { useEffect, useState } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react'
import DateFilter, { DateFilterType } from '../components/DateFilter'
import { API_URL } from '../config/api'

interface BalanceData {
  totals: {
    purchases: number
    sales: number
    netReceivable: number
    netPayable: number
  }
  counts: {
    purchases: number
    sales: number
  }
}

interface Sale {
  _id: string
  customerName: string
  totalAmount: number
  paidAmount?: number
  date: string
}

interface Purchase {
  _id: string
  supplierName: string
  totalAmount: number
  paidAmount?: number
  date: string
}

export default function BalanceSheet() {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStartDate, setFilterStartDate] = useState<string | undefined>()
  const [filterEndDate, setFilterEndDate] = useState<string | undefined>()
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('')
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('')
  const [customers, setCustomers] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([])

  useEffect(() => {
    fetchCustomersAndSuppliers()
    fetchAllData()
  }, [])

  useEffect(() => {
    calculateBalance()
  }, [filterStartDate, filterEndDate, selectedCustomerFilter, selectedSupplierFilter, allSales, allPurchases])

  const fetchCustomersAndSuppliers = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {}

      // Fetch customers
      const customersRes = await axios.get(`${API_URL}/customers`, config)
      const customerNames = customersRes.data.customers.map((c: any) => c.name)
      
      // Fetch suppliers
      const suppliersRes = await axios.get(`${API_URL}/suppliers`, config)
      const supplierNames = suppliersRes.data.suppliers.map((s: any) => s.name)

      setCustomers(customerNames.sort())
      setSuppliers(supplierNames.sort())
    } catch (err) {
      console.error('Failed to fetch customers/suppliers', err)
    }
  }

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [salesRes, purchasesRes] = await Promise.all([
        axios.get(`${API_URL}/ledger/sales`),
        axios.get(`${API_URL}/ledger/purchases`)
      ])
      setAllSales(salesRes.data.sales)
      setAllPurchases(purchasesRes.data.purchases)
    } catch (err) {
      console.error('Failed to fetch data', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateBalance = () => {
    let filteredSales = [...allSales]
    let filteredPurchases = [...allPurchases]

    // Apply date filter
    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate)
      const end = new Date(filterEndDate)
      filteredSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.date)
        return saleDate >= start && saleDate <= end
      })
      filteredPurchases = filteredPurchases.filter(purchase => {
        const purchaseDate = new Date(purchase.date)
        return purchaseDate >= start && purchaseDate <= end
      })
    }

    // Apply customer filter
    if (selectedCustomerFilter) {
      filteredSales = filteredSales.filter(sale => sale.customerName === selectedCustomerFilter)
    }

    // Apply supplier filter
    if (selectedSupplierFilter) {
      filteredPurchases = filteredPurchases.filter(purchase => purchase.supplierName === selectedSupplierFilter)
    }

    // Calculate totals
    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0)
    
    const totalSalesPaid = filteredSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0)
    const totalPurchasesPaid = filteredPurchases.reduce((sum, purchase) => sum + (purchase.paidAmount || 0), 0)
    
    const netReceivable = totalSales - totalSalesPaid
    const netPayable = totalPurchases - totalPurchasesPaid

    setBalance({
      totals: {
        sales: totalSales,
        purchases: totalPurchases,
        netReceivable,
        netPayable
      },
      counts: {
        sales: filteredSales.length,
        purchases: filteredPurchases.length
      }
    })
  }

  const handleFilterChange = (_filter: DateFilterType, startDate?: string, endDate?: string) => {
    setFilterStartDate(startDate)
    setFilterEndDate(endDate)
  }

  const handleCustomerFilterChange = (customer: string) => {
    setSelectedCustomerFilter(customer)
  }

  const handleSupplierFilterChange = (supplier: string) => {
    setSelectedSupplierFilter(supplier)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!balance) return null

  const profit = balance.totals.sales - balance.totals.purchases
  const netCashFlow = balance.totals.netReceivable - balance.totals.netPayable

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
        <p className="text-gray-600 mt-1">Financial overview and summary</p>
      </div>

      <DateFilter
        onFilterChange={handleFilterChange}
        showCustomerFilter={true}
        showSupplierFilter={true}
        customers={customers}
        suppliers={suppliers}
        selectedCustomer={selectedCustomerFilter}
        selectedSupplier={selectedSupplierFilter}
        onCustomerChange={handleCustomerFilterChange}
        onSupplierChange={handleSupplierFilterChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Income</h2>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sales</span>
              <span className="text-lg font-semibold text-gray-900">
                Rs {balance.totals.sales.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transactions</span>
              <span className="text-gray-900">{balance.counts.sales}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
            <TrendingDown className="w-6 h-6 text-red-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Purchases</span>
              <span className="text-lg font-semibold text-gray-900">
                Rs {balance.totals.purchases.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transactions</span>
              <span className="text-gray-900">{balance.counts.purchases}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Receivables</h2>
            <DollarSign className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Net Receivable</span>
              <span
                className={`text-lg font-semibold ${
                  balance.totals.netReceivable >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Rs {balance.totals.netReceivable.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Amount pending from customers
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payables</h2>
            <FileText className="w-6 h-6 text-orange-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Net Payable</span>
              <span
                className={`text-lg font-semibold ${
                  balance.totals.netPayable >= 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                Rs {balance.totals.netPayable.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Amount pending to suppliers
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Summary</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-primary-200">
            <span className="text-gray-700 font-medium">Gross Profit</span>
            <span
              className={`text-2xl font-bold ${
                profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              Rs {profit.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-primary-200">
            <span className="text-gray-700 font-medium">Net Cash Flow</span>
            <span
              className={`text-xl font-semibold ${
                netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              Rs {netCashFlow.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="pt-2">
            <p className="text-sm text-gray-600">
              Net Cash Flow = Receivables - Payables
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

