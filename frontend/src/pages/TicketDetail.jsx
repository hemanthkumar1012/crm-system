import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Clock, User, Mail } from 'lucide-react'
import { format } from 'date-fns'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTicket(data)
        setStatus(data.status)
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      fetchTicket()
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText })
      })
      setNoteText('')
      fetchTicket()
    } catch (error) {
      console.error(error)
    } finally {
      setSavingNote(false)
    }
  }

  const statusColors = {
    'Open': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
    'Closed': 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const priorityColors = {
    'High': 'text-rose-600 bg-rose-50',
    'Medium': 'text-indigo-600 bg-indigo-50',
    'Low': 'text-slate-600 bg-slate-50'
  }

  if (loading) return <div className="text-center py-12 text-slate-500">Loading...</div>
  if (!ticket) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{ticket.ticket_id}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[ticket.status]}`}>
            {ticket.status}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[ticket.priority] || priorityColors['Medium']}`}>
            {ticket.priority} Priority
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 font-medium">Update Status:</span>
          <select
            value={status}
            onChange={handleStatusChange}
            className="border border-slate-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{ticket.subject}</h2>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Notes & History</h3>
            {ticket.notes && ticket.notes.length > 0 ? (
              <div className="space-y-4">
                {ticket.notes.map((note, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <p className="text-slate-800 whitespace-pre-wrap">{note.note_text}</p>
                    <div className="mt-3 flex items-center text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {format(new Date(note.created_at), 'PPpp')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No notes yet.</p>
            )}

            <form onSubmit={handleAddNote} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mt-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a new note..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingNote || !noteText.trim()}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {savingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Customer Details</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <User className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{ticket.customer_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Name</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                <div>
                  <a href={`mailto:${ticket.customer_email}`} className="text-sm font-medium text-indigo-600 hover:underline">
                    {ticket.customer_email}
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Email</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Created</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
