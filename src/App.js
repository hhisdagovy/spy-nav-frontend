// src/App.js
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Constants
const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'https://spy-nav-backend.onrender.com'

// App Component
function App() {
  // State Management
  const [dataPoints, setDataPoints] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // Data Fetching
  const fetchData = async () => {
    try {
      setLoading(true)
      const navRes = await axios.get(`${API_BASE}/api/spy-nav`, { timeout: 10000 })
      const priceRes = await axios.get(`${API_BASE}/api/spy-price`, { timeout: 10000 })

      console.log('NAV Response:', navRes.data)
      console.log('Price Response:', priceRes.data)

      const time = new Date().toLocaleTimeString()
      const nav = navRes.data.nav
      const price = priceRes.data.price

      setDataPoints((prev) => [
        ...prev.slice(-19),
        { time, nav, price },
      ])
      setError(null)
    } catch (err) {
      console.error('Fetch error:', err.message, err.response?.data)
      setError(err.response?.data?.details || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 6000) // Changed to 6 seconds to stay within Finnhub rate limits
    return () => clearInterval(iv)
  }, [])

  // Render
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-6 font-mono">
      <h1 className="text-3xl mb-4">📊 Real-Time SPY NAV vs Price</h1>

      {loading && <p className="text-yellow-400 mb-4">Loading...</p>}
      {error && <p className="text-red-400 mb-4">{error}</p>}

      {!error && dataPoints.length > 0 && (
        <div className="text-center mb-6">
          <p className="text-lg">
            NAV:{' '}
            <span className="text-green-400">
              ${dataPoints[dataPoints.length - 1].nav}
            </span>
          </p>
          <p className="text-lg">
            SPY:{' '}
            <span className="text-blue-400">
              ${dataPoints[dataPoints.length - 1].price}
            </span>
          </p>
        </div>
      )}

      <div className="w-full max-w-4xl h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataPoints}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="nav"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default App
