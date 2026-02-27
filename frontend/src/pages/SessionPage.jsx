import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const QR_REFRESH_MS = 4000;

export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [qrImage, setQrImage] = useState(null);
  const [remainingMs, setRemainingMs] = useState(40000);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchQR = useCallback(async () => {
    try {
      const { data } = await api.get(`/sessions/${id}/qr`);
      setQrImage(data.data.qrImage);
      setRemainingMs(data.data.remainingMs);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 410) {
        setSessionExpired(true);
        clearInterval(intervalRef.current);
        clearInterval(countdownRef.current);
        fetchAttendance();
      } else {
        setError('Failed to load QR.');
      }
      setLoading(false);
    }
  }, [id]);

  const fetchAttendance = useCallback(async () => {
    try {
      const { data } = await api.get(`/sessions/${id}/attendance`);
      setAttendance(data.data);
    } catch {
      // silent
    }
  }, [id]);

  const handleEndSession = async () => {
    try {
      await api.put(`/sessions/${id}/end`);
      setSessionExpired(true);
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
      fetchAttendance();
    } catch {
      setError('Failed to end session.');
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/sessions/${id}/attendance/export`, '_blank');
  };

  useEffect(() => {
    fetchQR();
    intervalRef.current = setInterval(fetchQR, QR_REFRESH_MS);

    // Countdown tick every second
    countdownRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(countdownRef.current);
          setSessionExpired(true);
          fetchAttendance();
          return 0;
        }
        return next;
      });
    }, 1000);

    // Also poll attendance every 5 seconds
    const attInterval = setInterval(fetchAttendance, 5000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
      clearInterval(attInterval);
    };
  }, [fetchQR, fetchAttendance]);

  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">📡 Live Attendance Session</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-white text-indigo-700 text-sm font-semibold px-3 py-1 rounded-lg hover:bg-indigo-50"
        >
          ← Dashboard
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
        )}

        {!sessionExpired ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <h2 className="text-lg font-bold text-gray-700 mb-1">
              Scan QR to mark attendance
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              QR refreshes every 4 seconds • Session expires in{' '}
              <span
                className={`font-bold ${seconds <= 10 ? 'text-red-500' : 'text-indigo-600'}`}
              >
                {seconds}s
              </span>
            </p>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Loading QR...
              </div>
            ) : (
              <img
                src={qrImage}
                alt="Attendance QR Code"
                className="mx-auto rounded-xl border-4 border-indigo-200 w-72 h-72 object-contain"
              />
            )}

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-1000"
                style={{ width: `${(seconds / 40) * 100}%` }}
              />
            </div>

            <button
              onClick={handleEndSession}
              className="mt-6 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 font-semibold transition"
            >
              ⏹ End Session
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <h2 className="text-xl font-bold text-gray-700">Session Ended</h2>
            <p className="text-gray-400 text-sm mt-1">QR is now invalid</p>
          </div>
        )}

        {/* Live attendance list */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              👥 Present: {attendance.length}
            </h2>
            {attendance.length > 0 && (
              <button
                onClick={handleExport}
                className="bg-green-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-600 font-semibold transition"
              >
                📥 Export Excel
              </button>
            )}
          </div>

          {attendance.length === 0 ? (
            <p className="text-gray-400 text-sm">No attendance yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="text-left p-2">Roll No</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => (
                    <tr key={a._id} className="border-t hover:bg-gray-50">
                      <td className="p-2 font-mono">{a.rollNo}</td>
                      <td className="p-2">{a.name}</td>
                      <td className="p-2">{a.department}</td>
                      <td className="p-2 text-gray-400">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
