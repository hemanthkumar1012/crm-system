import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Ticket } from 'lucide-react'

export default function Layout() {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'New Ticket', path: '/create', icon: PlusCircle },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Ticket className="w-6 h-6 text-indigo-600 mr-2" />
          <span className="font-bold text-xl text-slate-800">Support CRM</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-700' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
