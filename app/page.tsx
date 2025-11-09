'use client';

import { useState, useEffect } from 'react';

type Email = {
  id: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  created_at: string;
};

export default function HomePage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password) {
      setIsAuthenticated(true);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchEmails = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await fetch('/api/events', {
            headers: {
              Authorization: `Bearer ${password}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setEmails(data);
          } else {
            setError('Failed to fetch emails. Check password.');
            setIsAuthenticated(false);
          }
        } catch (e) {
          setError('An error occurred.');
          setIsAuthenticated(false);
        } finally {
          setLoading(false);
        }
      };
      fetchEmails();
    }
  }, [isAuthenticated, password]);

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Enter Password</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  if (selectedEmail) {
    return (
      <div className="p-8">
        <button
          onClick={() => setSelectedEmail(null)}
          className="mb-4 bg-gray-200 p-2 rounded"
        >
          &larr; Back to Inbox
        </button>
        <div className="border rounded-lg p-4 bg-white">
          <h2 className="text-2xl font-bold">{selectedEmail.subject}</h2>
          <p className="text-sm text-gray-600">From: {selectedEmail.from}</p>
          <p className="text-sm text-gray-600">To: {selectedEmail.to}</p>
          <p className="text-sm text-gray-500 mb-4">
            {new Date(selectedEmail.created_at).toLocaleString()}
          </p>
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Resend Inbox</h1>
      <input
        type="text"
        placeholder="Search by subject or sender..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      {loading && <p>Loading emails...</p>}
      <ul className="space-y-2">
        {filteredEmails.map((email) => (
          <li
            key={email.id}
            onClick={() => setSelectedEmail(email)}
            className="p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50"
          >
            <div className="flex justify-between">
              <p className="font-bold">{email.subject}</p>
              <p className="text-sm text-gray-500">
                {new Date(email.created_at).toLocaleDateString()}
              </p>
            </div>
            <p className="text-sm text-gray-600">{email.from}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
