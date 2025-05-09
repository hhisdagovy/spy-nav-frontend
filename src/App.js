// src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const API_BASE = 'https://spy-nav-backend.onrender.com';

async function fetchData() {
  const { data: { nav } }   = await axios.get(`${API_BASE}/api/spy-nav`);
  const { data: { price } } = await axios.get(`${API_BASE}/api/spy-price`);

  const fetchData = async () => {
    try {
      const [navRes, priceRes] = await Promise.all([
        axios.get(`${API_BASE}/api/spy-nav`),
        axios.get(`${API_BASE}/api/spy-price`)
      ]);

      const time  = new Date().toLocaleTimeString();
      const nav   = navRes.data.nav;
      const price = priceRes.data.price;

      const next = [...dataPoints.slice(-19), { time, nav, price }];
      console.log('next datapoints:', next);
      setDataPoints(next);
      
        ...prev.slice(-19),
        { time, nav, price }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      background: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
        📊 Real‑Time SPY NAV vs Price
      </h1>

      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {!error && dataPoints.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ marginRight: '2rem' }}>
            NAV: <strong style={{ color: '#22c55e' }}>${dataPoints.at(-1).nav}</strong>
          </span>
          <span>
            SPY: <strong style={{ color: '#3b82f6' }}>${dataPoints.at(-1).price}</strong>
          </span>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 800, height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataPoints}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={['auto','auto']} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="nav"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;
