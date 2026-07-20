import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../../api/axios.js';

/** Email verification landing page — verifies the token on load. */
export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch((e) => { setStatus('error'); setMessage(e.message); });
  }, [token]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-primary" />
            <h1 className="mt-4 text-xl font-bold">Verifying your email…</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <FiCheckCircle className="mx-auto text-6xl text-green-400" />
            <h1 className="mt-4 text-xl font-bold">Email verified!</h1>
            <p className="mt-2 text-sm text-slate-400">Your account is fully activated. Happy shopping!</p>
            <Link to="/products" className="btn-primary mt-6 inline-flex">Start shopping</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <FiXCircle className="mx-auto text-6xl text-red-400" />
            <h1 className="mt-4 text-xl font-bold">Verification failed</h1>
            <p className="mt-2 text-sm text-slate-400">{message}</p>
            <Link to="/" className="btn-outline mt-6 inline-flex">Back to home</Link>
          </>
        )}
      </div>
    </div>
  );
}
