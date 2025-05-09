// src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function App() {
  const [dataPoints, setDataPoints] = useState([]);
  const [error, setError]         = useState(null);

  const fetchData = async () => {
    try {
      const [navRes, priceRes] = await Promise.all([
        axios.get('http://localhost:5050/api/spy-nav'),
        axios.get('http://localhost:5050/api/spy-price')
      ]);

      const time  = new Date().toLocaleTimeString();
      const nav   = navRes.data.nav;
      const price = priceRes.data.price;

      setDataPoints(prev => [...prev.slice(-19), { time, nav, price }]);
      setError(null);
    } catch {
      setError('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, []);

  const latest = dataPoints[dataPoints.length - 1] || {};

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center py-12 px-4">
      <h1 className="text-4xl font-light text-white mb-8">📊 SPY NAV Dashboard</h1>

      {error && (
        <div className="mb-6 px-4 py-2 bg-red-700 text-red-100 rounded">
          {error}
        </div>
      )}

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* NAV Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center">
          <span className="text-sm uppercase text-gray-400">Current NAV</span>
          <span className="mt-2 text-5xl font-bold text-green-400">
            {latest.nav !== undefined ? `$${latest.nav}` : '—'}
          </span>
        </div>
        {/* Price Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center">
          <span className="text-sm uppercase text-gray-400">SPY Price</span>
          <span className="mt-2 text-5xl font-bold text-blue-400">
            {latest.price !== undefined ? `$${latest.price}` : '—'}
          </span>
        </div>
      </div>

      {/* Chart Card */}
      <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-xl p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dataPoints}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}
              itemStyle={{ color: '#f8fafc' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Line dataKey="nav"   stroke="#22c55e" strokeWidth={3} dot={false} />
            <Line dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
