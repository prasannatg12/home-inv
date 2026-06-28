import React from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function Fab({ to = '/create' }) {
  return (
    <Link
      to={to}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-shadow"
      aria-label="Add new item"
    >
      <Plus className="w-5 h-5" />
    </Link>
  )
}
