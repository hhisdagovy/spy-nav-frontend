// src/App.js
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  const [loading, setLoading] = useState(true)

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
      const baseUrl = API_BASE.replace(/\/+$/, '')
      console.log('Normalized API_BASE:', baseUrl)
      
      const navUrl = new URL('/api/spy-nav', baseUrl).toString()
      console.log('Fetching data from:', navUrl)
      const navRes = await fetchWithRetry(navUrl)
      
      const priceUrl = new URL('/api/spy-price', baseUrl).toString()
      console.log('Fetching data from:', priceUrl)
      const priceRes = await fetchWithRetry(priceUrl)

      console.log('NAV Response:', navRes.data, 'Status:', navRes.status)
      console.log('Price Response:', priceRes.data, 'Status:', priceRes.status)

      if (!navRes.data.nav || typeof navRes.data.nav !== 'number') {
        throw new Error('Invalid NAV data structure')
      }
      if (!priceRes.data.price || typeof priceRes.data.price !== 'number') {
        throw new Error('Invalid price data structure')
      }

      const time = new Date().toLocaleTimeString()
      const nav = navRes.data.nav
      const price = priceRes.data.price
      const difference = parseFloat((nav - price).toFixed(2)) // Calculate NAV - Price

      setDataPoints((prev) => [
        ...prev.slice(-19),
        { time, nav, price, difference },
      ])
      setError(null)
    } catch (err) {
      console.error('Fetch error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      })
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
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-8 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center text-teal-400">
        📈 SPY NAV Tracker
      </h1>

      {loading && dataPoints.length === 0 && (
        <p className="text-yellow-300 text-lg mb-6 animate-pulse">Loading...</p>
      )}
      {error && dataPoints.length === 0 && (
        <p className="text-red-400 text-lg mb-6">{error}</p>
      )}

      {dataPoints.length > 0 && (
        <div className="w-full max-w-5xl space-y-8">
          {/* Current Values Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-semibold text-teal-300 mb-4">
              Latest Values
            </h2>
            <div className="flex justify-center space-x-8">
              <div>
                <p className="text-lg text-gray-300">NAV</p>
                <p className="text-3xl font-bold text-green-400">
                  ${dataPoints[dataPoints.length - 1].nav}
                </p>
              </div>
              <div>
                <p className="text-lg text-gray-300">SPY Price</p>
                <p className="text-3xl font-bold text-blue-400">
                  ${dataPoints[dataPoints.length - 1].price}
                </p>
              </div>
              <div>
                <p className="text-lg text-gray-300">Difference</p>
                <p
                  className={`text-3xl font-bold ${
                    dataPoints[dataPoints.length - 1].difference >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {dataPoints[dataPoints.length - 1].difference >= 0 ? '+' : ''}$
                  {dataPoints[dataPoints.length - 1].difference}
                </p>
              </div>
            </div>
          </div>

          {/* NAV vs Price Chart */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-teal-300 mb-4 text-center">
              NAV vs SPY Price Over Time
            </h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nav"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    name="NAV"
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                    name="SPY Price"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Difference Chart */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-teal-300 mb-4 text-center">
              NAV - SPY Price Difference
            </h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="difference"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.3}
                    name="Difference (NAV - Price)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
