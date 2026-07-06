import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Landing  from '../pages/Landing'
import Login    from '../pages/Login'
import Register from '../pages/Register'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Landing />} />
        <Route path="/features" element={<Landing />} />
        <Route path="/pricing"  element={<Landing />} />
        <Route path="/download" element={<Landing />} />
        <Route path="/contact"  element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
