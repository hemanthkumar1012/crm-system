import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CreateTicket from './pages/CreateTicket'
import TicketDetail from './pages/TicketDetail'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreateTicket />} />
          <Route path="ticket/:id" element={<TicketDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
