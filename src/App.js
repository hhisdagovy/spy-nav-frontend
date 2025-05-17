// src/App.js (Updated with better error handling)
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

// Mock data for development/debugging
const MOCK_DATA = [
  { time: '10:00 AM', nav: 500.25, price: 499.75, difference: 0.50 },
  { time: '10:01 AM', nav: 500.30, price: 499.80, difference: 0.50 },
  { time: '10:02 AM', nav: 500.40, price: 499.85, difference: 0.55 },
  // Add more mock data points as needed
]

// App Component
function App() {
  // State Management
  const [dataPoints, setDataPoints] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [useMockData, setUseMockData] = useState(false)

  // Retry helper for frontend requests
  const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        // Add headers if needed for authentication
        const headers = {}
        // If you have an API key or token, add it here
        // headers.Authorization = `Bearer ${yourApiToken}`
        
        const response = await axios.get(url, { 
          timeout: 15000,
          headers
        })
        return response
      } catch (err) {
        if (i === retries - 1) throw err
        console.warn(`Retrying frontend request (${i + 1}/${retries}): ${url}, Error: ${err.message}`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Handle enabling mock data mode
  const enableMockData = () => {
    setUseMockData(true)
    setDataPoints(MOCK_DATA)
    setLoading(false)
    setError(null)
  }

  // Manual retry function
  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1)
    setError(null)
    setLoading(true)
  }

  // Data Fetching
  const fetchData = async () => {
    // If mock data is enabled, don't fetch from API
    if (useMockData) return
    
    try {
      setLoading(true)
      const baseUrl = API_BASE.replace(/\/+$/, '')
      console.log('Normalized API_BASE:', baseUrl)
      
      // Detailed error information
      let errorDetails = {}

      try {
        const navUrl = new URL('/api/spy-nav', baseUrl).toString()
        console.log('Fetching NAV data from:', navUrl)
        const navRes = await fetchWithRetry(navUrl)
        console.log('NAV Response:', navRes.data, 'Status:', navRes.status)
        
        errorDetails.navResponse = navRes.status
        
        if (!navRes.data.nav || typeof navRes.data.nav !== 'number') {
          throw new Error('Invalid NAV data structure')
        }
      } catch (navErr) {
        errorDetails.navError = `${navErr.message} (Status: ${navErr.response?.status || 'unknown'})`
        throw navErr
      }
      
      try {
        const priceUrl = new URL('/api/spy-price', baseUrl).toString()
        console.log('Fetching price data from:', priceUrl)
        const priceRes = await fetchWithRetry(priceUrl)
        console.log('Price Response:', priceRes.data, 'Status:', priceRes.status)
        
        errorDetails.priceResponse = priceRes.status
        
        if (!priceRes.data.price || typeof priceRes.data.price !== 'number') {
          throw new Error('Invalid price data structure')
        }
      } catch (priceErr) {
        errorDetails.priceError = `${priceErr.message} (Status: ${priceErr.response?.status || 'unknown'})`
        throw priceErr
      }

      // If we got here, both requests were successful
      const time = new Date().toLocaleTimeString()
      const nav = navRes.data.nav
      const price = priceRes.data.price
      const difference = parseFloat((nav - price).toFixed(2))

      const newDataPoint = { time, nav, price, difference }
      setDataPoints((prev) => {
        const updated = [...prev.slice(-19), newDataPoint]
        console.log('Updated dataPoints:', updated) // Debug log
        return updated
      })
      setError(null)
    } catch (err) {
      console.error('Fetch error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      })
      
      // Create a more descriptive error message
      let errorMessage = 'Request failed: '
      
      if (err.response?.status === 401) {
        errorMessage += 'Authentication error (401). API key may be invalid or missing.'
      } else if (err.response?.status === 403) {
        errorMessage += 'Access forbidden (403). You may not have permission to access this resource.'
      } else if (err.response?.status === 404) {
        errorMessage += 'API endpoint not found (404). Check that the server is running and the endpoint is correct.'
      } else if (err.response?.status >= 500) {
        errorMessage += `Server error (${err.response.status}). The server may be down or experiencing issues.`
      } else if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. The server may be slow or unresponsive.'
      } else if (err.message.includes('Network Error')) {
        errorMessage += 'Network error. Check your internet connection or the server may be down.'
      } else {
        errorMessage += err.message || 'Unknown error'
      }
      
      if (dataPoints.length === 0) {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    console.log('useEffect triggered, retryCount:', retryCount)
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
  }, [retryCount]) // Adding retryCount as a dependency

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
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6 max-w-2xl w-full">
          <p className="text-red-400 text-lg mb-2">{error}</p>
          <div className="flex space-x-4 mt-4">
            <button 
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Retry Connection
            </button>
            <button 
              onClick={enableMockData}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              Use Demo Data
            </button>
          </div>
        </div>
      )}

      {dataPoints.length > 0 ? (
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
                  ${dataPoints[dataPoints.length - 1].nav.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-lg text-gray-300">SPY Price</p>
                <p className="text-3xl font-bold text-blue-400">
                  ${dataPoints[dataPoints.length - 1].price.toFixed(2)}
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
                  {Math.abs(dataPoints[dataPoints.length - 1].difference).toFixed(2)}
                </p>
              </div>
            </div>
            {useMockData && (
              <p className="text-yellow-300 text-sm mt-4">
                Using demo data. Data shown is for demonstration purposes only.
              </p>
            )}
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
      ) : (
        <p className="text-gray-400 text-lg">No data available to display charts.</p>
      )}
    </div>
  )
}

export default App
