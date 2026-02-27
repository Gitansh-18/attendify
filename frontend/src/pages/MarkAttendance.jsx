import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function MarkAttendance() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    rollNo: '',
    name: '',
    department: '',
    encryptedPayload: searchParams.get('payload') || '',
  });
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');

    if (!form.encryptedPayload) {
      setStatus('error');
      setMessage('Invalid QR code. Please scan again.');
      return;
    }

    try {
      const { data } = await api.post('/attendance/mark', form);
      setStatus('success');
      setMessage(data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to mark attendance.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-700">Attendance Marked!</h2>
          <p className="text-gray-500 text-sm mt-2">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-teal-700 mb-2">
          📋 Mark Attendance
        </h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          Fill in your details to mark attendance
        </p>

        {status === 'error' && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Roll Number"
            value={form.rollNo}
            onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
          <input
            type="text"
            placeholder="Department (e.g. CSE)"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
          {!form.encryptedPayload && (
            <textarea
              placeholder="Paste encrypted QR payload here"
              value={form.encryptedPayload}
              onChange={(e) => setForm({ ...form, encryptedPayload: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs h-20 font-mono"
              required
            />
          )}
          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition font-semibold"
          >
            ✅ Submit Attendance
          </button>
        </form>
      </div>
    </div>
  );
}
