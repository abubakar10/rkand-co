import { useEffect, useState } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, ShoppingCart, Users, DollarSign, Package } from 'lucide-react'

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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/ledger/balance`)
      setStats(res.data)
    } catch (err) {
      console.error('Failed to fetch stats', err)
    } finally {
      setLoading(false)
    }
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
      change: stats?.totals.netReceivable >= 0 ? 'positive' : 'negative',
    },
    {
      title: 'Net Payable',
      value: `Rs ${stats?.totals.netPayable.toLocaleString('en-IN') || 0}`,
      icon: TrendingDown,
      color: 'bg-red-500',
      change: stats?.totals.netPayable >= 0 ? 'positive' : 'negative',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your business operations</p>
      </div>

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

