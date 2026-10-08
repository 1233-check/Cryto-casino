import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ShieldAlert, CheckCircle, Clock, Search, XCircle, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage({ onNavigate }) {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending', 'completed', 'rejected', 'all'
  const [search, setSearch] = useState('');
  
  // Basic admin check (In production, use Custom Claims on Firebase Auth or a separate admins collection)
  const isAdmin = user?.email === 'admin@cryptocasino.com'; // Replace with actual admin email check or logic

  useEffect(() => {
    if (!user) return;

    // Listen to withdrawals collection
    const q = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWithdrawals(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateStatus = async (id, status, txHash = '') => {
    try {
      const withdrawalRef = doc(db, 'withdrawals', id);
      await updateDoc(withdrawalRef, {
        status,
        ...(txHash && { txHash }),
        updatedAt: new Date()
      });
      // Note: If rejected, you would typically write a backend cloud function to refund the user's balance.
      // For this UI, we just update the status.
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const processApproval = (req) => {
    const hash = window.prompt(`Approving withdrawal of ${req.amount} ${req.asset || req.chain}.\nPlease send the funds to: ${req.toAddress}\n\nEnter the Transaction Hash to confirm:`);
    if (hash) {
      handleUpdateStatus(req.id, 'completed', hash);
    }
  };

  const filteredWithdrawals = withdrawals.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.uid.includes(search) || req.toAddress.includes(search);
    return matchesFilter && matchesSearch;
  });

  // If not admin, show access denied
  // NOTE: For demonstration, we allow viewing if they bypass the UI, but in production Firestore Security Rules should block read access to non-admins.
  
  return (
    <div className="flex flex-col h-full bg-[#0F212E] text-white p-4 sm:p-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black font-display tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#ED4163]" />
            Admin Dashboard
          </h1>
          <p className="text-[#B1BAD3] text-sm mt-1">Manage withdrawal requests and monitor platform activity</p>
        </div>
        <button onClick={() => onNavigate('home')} className="bg-[#1A2C38] px-4 py-2 rounded-lg text-sm font-bold text-[#B1BAD3] hover:text-white transition-colors">
          Back to Casino
        </button>
      </div>

      {!isAdmin && (
        <div className="bg-[#ED4163]/10 border border-[#ED4163]/20 rounded-2xl p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-[#ED4163] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-[#B1BAD3] mb-4">You do not have administrative privileges to view this page.</p>
          <p className="text-xs text-[#557086]">In a production environment, Firebase Security Rules would block this request.</p>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar Stats / Filters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#1A2C38] rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold text-white text-sm mb-4">Withdrawal Status</h3>
              <div className="space-y-2">
                {['pending', 'completed', 'rejected', 'all'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      filter === status ? 'bg-white/10 text-white font-bold' : 'text-[#B1BAD3] hover:bg-white/5'
                    }`}
                  >
                    <span className="capitalize">{status}</span>
                    {status !== 'all' && (
                      <span className="bg-[#0F212E] px-2 py-0.5 rounded-full text-xs font-mono">
                        {withdrawals.filter(w => w.status === status).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1A2C38] rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold text-white text-sm mb-3">Important Notice</h3>
              <p className="text-xs text-[#B1BAD3] leading-relaxed">
                Before approving a withdrawal, ensure you have sufficient balance in your Hot Wallet. 
                Always verify the destination address matches the chain requested.
              </p>
            </div>
          </div>

          {/* Main Content: Withdrawals Table */}
          <div className="lg:col-span-3 bg-[#1A2C38] rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#213743]">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-[#B1BAD3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search UID or Address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0F212E] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#1475E1] transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#1A2C38] sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider">User UID</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider">Amount / Asset</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-[#B1BAD3]">Loading requests...</td>
                      </tr>
                    ) : filteredWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-[#B1BAD3]">No withdrawal requests found.</td>
                      </tr>
                    ) : (
                      filteredWithdrawals.map(req => (
                        <motion.tr 
                          key={req.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{req.timestamp ? new Date(req.timestamp.toDate()).toLocaleDateString() : 'Just now'}</div>
                            <div className="text-xs text-[#557086]">{req.timestamp ? new Date(req.timestamp.toDate()).toLocaleTimeString() : ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs font-mono text-[#B1BAD3] bg-black/20 px-2 py-1 rounded inline-block">
                              {req.uid.slice(0, 8)}...{req.uid.slice(-4)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-base">{req.amount}</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1475E1]/10 text-[#1475E1] uppercase">
                                {req.asset || req.chain}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs font-mono text-[#B1BAD3] max-w-[150px] truncate" title={req.toAddress}>
                              {req.toAddress}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {req.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#F0B90B]/10 text-[#F0B90B]">
                                <Clock className="w-3.5 h-3.5" /> Pending
                              </span>
                            )}
                            {req.status === 'completed' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#00E701]/10 text-[#00E701]">
                                <CheckCircle className="w-3.5 h-3.5" /> Completed
                              </span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#ED4163]/10 text-[#ED4163]">
                                <XCircle className="w-3.5 h-3.5" /> Rejected
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {req.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                  className="p-2 rounded-lg text-[#B1BAD3] hover:text-[#ED4163] hover:bg-[#ED4163]/10 transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => processApproval(req)}
                                  className="px-4 py-2 rounded-lg bg-[#00E701]/10 text-[#00E701] font-bold text-sm hover:bg-[#00E701]/20 transition-colors flex items-center gap-2"
                                >
                                  Approve
                                  <ArrowRightLeft className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-[#557086] font-mono">
                                {req.txHash ? (
                                  <a href="#" className="hover:text-white transition-colors underline" title={req.txHash}>
                                    Tx: {req.txHash.slice(0, 6)}...
                                  </a>
                                ) : '-'}
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
