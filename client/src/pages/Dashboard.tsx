import { useEffect, useState } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, ShoppingCart, Users, DollarSign, Package } from 'lucide-react'
import DateFilter, { DateFilterType } from '../components/DateFilter'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface DashboardStats {
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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
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
    calculateStats()
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

  const calculateStats = () => {
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

    setStats({
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

  const statCards = [
    {
      title: 'Total Purchases',
      value: `Rs ${stats?.totals.purchases.toLocaleString('en-IN') || 0}`,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: stats?.counts.purchases || 0,
      changeLabel: 'transactions',
    },
    {
      title: 'Total Sales',
      value: `Rs ${stats?.totals.sales.toLocaleString('en-IN') || 0}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: stats?.counts.sales || 0,
      changeLabel: 'transactions',
    },
    {
      title: 'Net Receivable',
      value: `Rs ${stats?.totals.netReceivable.toLocaleString('en-IN') || 0}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: (stats?.totals.netReceivable ?? 0) >= 0 ? 'positive' : 'negative',
    },
    {
      title: 'Net Payable',
      value: `Rs ${stats?.totals.netPayable.toLocaleString('en-IN') || 0}`,
      icon: TrendingDown,
      color: 'bg-red-500',
      change: (stats?.totals.netPayable ?? 0) >= 0 ? 'positive' : 'negative',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your business operations</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  {card.changeLabel && (
                    <p className="text-xs text-gray-500 mt-1">
                      {card.change} {card.changeLabel}
                    </p>
                  )}
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/purchases"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-primary-600" />
              <span className="font-medium">Add New Purchase</span>
            </a>
            <a
              href="/sales"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="w-5 h-5 text-primary-600" />
              <span className="font-medium">Add New Sale</span>
            </a>
            <a
              href="/balance"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <DollarSign className="w-5 h-5 text-primary-600" />
              <span className="font-medium">View Balance Sheet</span>
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Products</h2>
          <div className="space-y-2">
            {['Petrol', 'Hi-Octane', 'Diesel', 'Mobile Oil'].map((product) => (
              <div
                key={product}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">{product}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

