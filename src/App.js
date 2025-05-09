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
console.log('Using API_BASE:', API_BASE)

// App Component
function App() {
  // State Management
  const [dataPoints, setDataPoints] = useState([])
  const [error, setError] = useState(null)
  [loading, setLoading] = useState(true)

  // Retry helper for frontend requests
  const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, { timeout: 15000 })
        return response
      } catch (err) {
        if (i === retries - 1) throw err
        console.warn(`Retrying frontend request (${i + 1}/${retries}): ${url}, Error: ${err.message}`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Data Fetching
  const fetchData = async () => {
    try {
      setLoading(true)
      // Use URL construction to avoid double slashes
      const navUrl = new URL('/api/spy-nav', API_BASE).toString()
      console.log('Fetching data from:', navUrl)
      const navRes = await fetchWithRetry(navUrl)
      
      const priceUrl = new URL('/api/spy-price', API_BASE).toString()
      console.log('Fetching data from:', priceUrl)
      const priceRes = await fetchWithRetry(priceUrl)

      console.log('NAV Response:', navRes.data, 'Status:', navRes.status)
      console.log('Price Response:', priceRes.data, 'Status:', priceRes.status)

      // Validate response structure
      if (!navRes.data.nav || typeof navRes.data.nav !== 'number') {
        throw new Error('Invalid NAV data structure')
      }
      if (!priceRes.data.price || typeof priceRes.data.price !== 'number') {
        throw new Error('Invalid price data structure')
      }

      const time = new Date().toLocaleTimeString()
      const nav = navRes.data.nav
      const price = priceRes.data.price

      setDataPoints((prev) => [
        ...prev.slice(-19),
        { time, nav, price },
      ])
      setError(null)
    } catch (err) {
      console.error('Fetch error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      })
      // Only set error if there’s no previous data
      if (dataPoints.length === 0) {
        setError(err.response?.data?.details || err.message || 'Failed to fetch data')
      }
    } finally {
      setLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    console.log('useEffect triggered')
    try {
      fetchData()
      const iv = setInterval(() => {
        console.log('Interval triggered fetchData')
        fetchData()
      }, 6000)
      return () => {
        console.log('Cleaning up interval')
        clearInterval(iv)
      }
    } catch (err) {
      console.error('Error in useEffect:', err.message)
      setError('Failed to initialize data fetching')
    }
  }, [])

  // Render
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-6 font-mono">
      <h1 className="text-3xl mb-4">📊 Real-Time SPY NAV vs Price</h1>

      {loading && dataPoints.length === 0 && <p className="text-yellow-400 mb-4">Loading...</p>}
      {error && dataPoints.length === 0 && <p className="text-red-400 mb-4">{error}</p>}

      {dataPoints.length > 0 && (
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

      {dataPoints.length > 0 && (
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
      )}
    </div>
  )
}

export default App
