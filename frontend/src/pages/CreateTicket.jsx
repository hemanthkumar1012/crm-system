import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'

export default function CreateTicket() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    description: '',
    priority: 'Medium'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        navigate('/')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Create New Ticket</h1>
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to list
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
              <input
                required
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                required
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              required
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Detailed explanation..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
