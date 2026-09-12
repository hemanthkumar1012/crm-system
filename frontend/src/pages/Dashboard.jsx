import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, AlertCircle, Clock, CheckCircle2, Ticket } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({ open: 0, inProgress: 0, closed: 0, total: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [search, statusFilter])

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (search) query.append('search', search)
      if (statusFilter) query.append('status', statusFilter)
      
      const res = await fetch(`http://localhost:3000/api/tickets?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    'Open': 'bg-emerald-100 text-emerald-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'Closed': 'bg-slate-100 text-slate-700'
  }

  const priorityColors = {
    'High': 'text-rose-600 bg-rose-50',
    'Medium': 'text-indigo-600 bg-indigo-50',
    'Low': 'text-slate-600 bg-slate-50'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tickets', value: stats.total, icon: Ticket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Closed', value: stats.closed, icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map((stat, i) => {
           const Icon = stat.icon;
           return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
           )
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading tickets...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No tickets found.</td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.ticket_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/ticket/${ticket.ticket_id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                        {ticket.ticket_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-900">{ticket.customer_name}</td>
                    <td className="px-6 py-4 text-slate-900 max-w-xs truncate">{ticket.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority] || priorityColors['Medium']}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
