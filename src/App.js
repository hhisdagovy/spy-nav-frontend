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

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://spy-nav-backend.onrender.com'

function App() {
  const [dataPoints, setDataPoints] = useState([])
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      const navRes = await axios.get(`${API_BASE}/api/spy-nav`)
      const priceRes = await axios.get(`${API_BASE}/api/spy-price`)

      const time = new Date().toLocaleTimeString()
      const nav = navRes.data.nav
      const price = priceRes.data.price

      setDataPoints((prev) => [
        // keep only the last 19 entries
        ...prev.slice(-19),
        // add the new point
        { time, nav, price },
      ])
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch data')
    }
  }

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 5000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-6 font-mono">
      <h1 className="text-3xl mb-4">📊 Real‑Time SPY NAV vs Price</h1>

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
