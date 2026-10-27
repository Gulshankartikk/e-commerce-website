import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconCheckCircle2, IconXCircle } from '../../components/ui/icons.jsx';
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
      <div className="card-surface w-full max-w-md rounded-2xl p-8 text-center border border-[#E4EAE6] shadow-[0_8px_30px_rgba(21,61,43,0.08)]">
        {status === 'verifying' && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#E4EAE6] border-t-[#087F65]" />
            <h1 className="mt-4 text-xl font-bold text-[#202923]">Verifying your email…</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <IconCheckCircle2 size={56} className="mx-auto text-[#168764]" />
            <h1 className="mt-4 text-xl font-bold text-[#202923]">Email verified!</h1>
            <p className="mt-2 text-sm text-[#65716A]">Your account is fully activated. Happy shopping!</p>
            <Link to="/products" className="btn-primary mt-6 inline-flex">Start shopping</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <IconXCircle size={56} className="mx-auto text-[#B42318]" />
            <h1 className="mt-4 text-xl font-bold text-[#202923]">Verification failed</h1>
            <p className="mt-2 text-sm text-[#65716A]">{message}</p>
            <Link to="/" className="btn-outline mt-6 inline-flex">Back to home</Link>
          </>
        )}
      </div>
    </div>
  );
}
