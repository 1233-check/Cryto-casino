import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ShieldAlert, CheckCircle, Clock, Search, XCircle, ArrowRightLeft, Users, Edit3, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage({ onNavigate }) {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState('withdrawals'); // 'withdrawals' | 'users'
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editBalance, setEditBalance] = useState('');
  
  // Basic admin check (In production, use Custom Claims on Firebase Auth or a separate admins collection)
  const isAdmin = user?.email === 'admin@cryptocasino.com'; // Replace with actual admin email check or logic

  useEffect(() => {
    if (!user) return;

    // Listen to withdrawals collection
    const qW = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'));
    const unsubW = onSnapshot(qW, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWithdrawals(data);
    });

    // Listen to users collection
    const qU = query(collection(db, 'users'), orderBy('balance', 'desc'));
    const unsubU = onSnapshot(qU, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(data);
      setLoading(false);
    });

    return () => { unsubW(); unsubU(); };
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

  const handleUpdateBalance = async (uid) => {
    try {
      const newBal = parseFloat(editBalance);
      if (isNaN(newBal) || newBal < 0) return alert('Invalid balance amount');
      
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { balance: newBal });
      setEditingUserId(null);
    } catch (err) {
      console.error('Error updating balance:', err);
      alert('Failed to update balance');
    }
  };

  const filteredWithdrawals = withdrawals.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.uid.includes(search) || req.toAddress?.includes(search);
    return matchesFilter && matchesSearch;
  });

  const filteredUsers = usersList.filter(u => {
    return u.id.includes(search) || (u.email && u.email.includes(search));
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
          <p className="text-[#B1BAD3] mb-4">
            You are currently logged in as: <strong className="text-white bg-black/20 px-2 py-1 rounded">{user?.email || 'Unknown User'}</strong>
          </p>
          <p className="text-[#B1BAD3] mb-6">You do not have administrative privileges to view this page.</p>
          <p className="text-xs text-[#557086]">In a production environment, Firebase Security Rules would block this request.</p>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar Stats / Filters */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Main Tabs */}
            <div className="bg-[#1A2C38] rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold text-white text-sm mb-4">Dashboard Modules</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('withdrawals')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'withdrawals' ? 'bg-[#ED4163]/10 text-[#ED4163] font-bold border border-[#ED4163]/20' : 'text-[#B1BAD3] hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Withdrawals
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'users' ? 'bg-[#1475E1]/10 text-[#1475E1] font-bold border border-[#1475E1]/20' : 'text-[#B1BAD3] hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Player Management
                </button>
              </div>
            </div>

            {activeTab === 'withdrawals' && (
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
            )}

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

            {/* Table Area */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              
              {activeTab === 'withdrawals' && (
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
                        <tr><td colSpan="6" className="px-6 py-8 text-center text-[#B1BAD3]">Loading requests...</td></tr>
                      ) : filteredWithdrawals.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-8 text-center text-[#B1BAD3]">No withdrawal requests found.</td></tr>
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
              )}

              {activeTab === 'users' && (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#1A2C38] sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider">User ID / Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider">Total Balance</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#557086] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence>
                      {loading ? (
                        <tr><td colSpan="4" className="px-6 py-8 text-center text-[#B1BAD3]">Loading users...</td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan="4" className="px-6 py-8 text-center text-[#B1BAD3]">No users found.</td></tr>
                      ) : (
                        filteredUsers.map(u => (
                          <motion.tr 
                            key={u.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-mono text-xs text-[#1475E1] bg-[#1475E1]/10 px-2 py-1 rounded inline-block mb-1">
                                {u.id}
                              </div>
                              {u.email && <div className="text-sm text-white">{u.email}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-[#B1BAD3]">
                                {u.createdAt?.toDate ? new Date(u.createdAt.toDate()).toLocaleDateString() : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingUserId === u.id ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    value={editBalance}
                                    onChange={(e) => setEditBalance(e.target.value)}
                                    className="bg-[#0F212E] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-32 focus:outline-none focus:border-[#1475E1]"
                                  />
                                </div>
                              ) : (
                                <span className="font-bold text-white text-base">${u.balance?.toFixed(2) || '0.00'}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {editingUserId === u.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => setEditingUserId(null)}
                                    className="p-2 rounded-lg text-[#B1BAD3] hover:text-[#ED4163] hover:bg-[#ED4163]/10 transition-colors"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateBalance(u.id)}
                                    className="px-3 py-1.5 rounded-lg bg-[#00E701]/10 text-[#00E701] font-bold text-sm hover:bg-[#00E701]/20 transition-colors flex items-center gap-1.5"
                                  >
                                    <Save className="w-4 h-4" /> Save
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => { setEditingUserId(u.id); setEditBalance(u.balance); }}
                                  className="p-2 rounded-lg text-[#B1BAD3] hover:text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2 text-xs font-bold"
                                >
                                  <Edit3 className="w-4 h-4" /> Edit Balance
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
