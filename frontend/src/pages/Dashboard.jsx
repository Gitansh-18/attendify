import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../api/AuthContext';

export default function Dashboard() {
  const { teacher, logout } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: '', subject: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data.data);
    } catch {
      setError('Failed to load classes.');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/classes', form);
      setForm({ name: '', subject: '' });
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this class?')) return;
    try {
      await api.delete(`/classes/${id}`);
      fetchClasses();
    } catch {
      setError('Failed to delete class.');
    }
  };

  const handleStartSession = async (classId) => {
    setLoading(true);
    try {
      const { data } = await api.post('/sessions/start', { classId });
      navigate(`/session/${data.data.sessionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🎓 QR Attendance</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-80">Hi, {teacher?.name}</span>
          <button
            onClick={logout}
            className="bg-white text-indigo-700 text-sm font-semibold px-3 py-1 rounded-lg hover:bg-indigo-50 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Create Class */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800">➕ Create New Class</h2>
          <form onSubmit={handleCreateClass} className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Class name (e.g. CSE-A)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <input
              type="text"
              placeholder="Subject (e.g. OS)"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition"
            >
              Create
            </button>
          </form>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800">📚 My Classes</h2>
          {classes.length === 0 ? (
            <p className="text-gray-400 text-sm">No classes yet. Create one above.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {classes.map((cls) => (
                <div
                  key={cls._id}
                  className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{cls.name}</h3>
                    <p className="text-sm text-gray-500">{cls.subject}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartSession(cls._id)}
                      disabled={loading}
                      className="flex-1 bg-green-500 text-white text-sm py-1.5 rounded-lg hover:bg-green-600 font-semibold transition disabled:opacity-50"
                    >
                      ▶ Start Session
                    </button>
                    <button
                      onClick={() => handleDelete(cls._id)}
                      className="bg-red-50 text-red-500 text-sm px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
