import { useState } from 'react'
import { Calendar, Filter } from 'lucide-react'

export type DateFilterType = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

interface DateFilterProps {
  onFilterChange: (filter: DateFilterType, startDate?: string, endDate?: string) => void
  showCustomerFilter?: boolean
  showSupplierFilter?: boolean
  customers?: string[]
  suppliers?: string[]
  selectedCustomer?: string
  selectedSupplier?: string
  onCustomerChange?: (customer: string) => void
  onSupplierChange?: (supplier: string) => void
}

export default function DateFilter({
  onFilterChange,
  showCustomerFilter = false,
  showSupplierFilter = false,
  customers = [],
  suppliers = [],
  selectedCustomer = '',
  selectedSupplier = '',
  onCustomerChange,
  onSupplierChange,
}: DateFilterProps) {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const handleDateFilterChange = (filter: DateFilterType) => {
    setDateFilter(filter)
    
    let startDate: string | undefined
    let endDate: string | undefined
    
    const now = new Date()
    
    switch (filter) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
        break
      case 'weekly':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        startDate = weekStart.toISOString()
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        endDate = weekEnd.toISOString()
        break
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
        break
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString()
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString()
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate).toISOString()
          endDate = new Date(customEndDate).toISOString()
          endDate = new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString()
        }
        break
      default:
        startDate = undefined
        endDate = undefined
    }
    
    onFilterChange(filter, startDate, endDate)
  }

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      handleDateFilterChange('custom')
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <select
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value as DateFilterType)}
            className="input text-sm"
          >
            <option value="all">All Time</option>
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="input text-sm"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="input text-sm"
              placeholder="End Date"
            />
            <button
              onClick={handleCustomDateApply}
              disabled={!customStartDate || !customEndDate}
              className="btn btn-primary text-sm px-3 py-1"
            >
              Apply
            </button>
          </div>
        )}

        {/* Customer Filter */}
        {showCustomerFilter && customers.length > 0 && (
          <div className="flex items-center space-x-2">
            <select
              value={selectedCustomer}
              onChange={(e) => onCustomerChange?.(e.target.value)}
              className="input text-sm"
            >
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Supplier Filter */}
        {showSupplierFilter && suppliers.length > 0 && (
          <div className="flex items-center space-x-2">
            <select
              value={selectedSupplier}
              onChange={(e) => onSupplierChange?.(e.target.value)}
              className="input text-sm"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

