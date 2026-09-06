import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginPromptModal from '../../components/LoginPromptModal';
import './LostFound.css';

const LostFound = () => {
    const navigate = useNavigate();
    const { token, user, isAuthenticated, loading: authLoading, logout } = useAuth();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    
    // Details Modal
    const [selectedItem, setSelectedItem] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Proof of Ownership Claim Modal State
    const [claimItem, setClaimItem] = useState(null);
    const [submittingClaim, setSubmittingClaim] = useState(false);
    const [claimError, setClaimError] = useState('');
    const [proofForm, setProofForm] = useState({
        proofDescription: '',
        dateLost: '',
        locationLost: '',
        contactNumber: '',
        studentRoll: '',
        studentDept: '',
        proofPhoto: '',
        declaredTrue: false,
    });

    // Login prompt modal state
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [blockedAction, setBlockedAction] = useState(null);

    // Prompt for login on landing if user is not authenticated
    useEffect(() => {
        if (!authLoading && !token) {
            setShowLoginModal(true);
        }
    }, [authLoading, token]);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/lostfound');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error('Error fetching lost & found:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Open Proof of Ownership Modal
    const openClaimModal = (item) => {
        if (!token || !isAuthenticated) {
            setBlockedAction('submit an ownership claim for this item');
            setShowLoginModal(true);
            return;
        }

        setClaimItem(item);
        setClaimError('');
        setProofForm({
            proofDescription: '',
            dateLost: item.date || new Date().toISOString().split('T')[0],
            locationLost: item.location || '',
            contactNumber: user?.phone || '',
            studentRoll: user?.rollNo || '',
            studentDept: user?.department || '',
            proofPhoto: '',
            declaredTrue: false,
        });
    };

    // Photo file upload helper (converts to base64)
    const handleProofPhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setClaimError('Proof photo must be under 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setProofForm((prev) => ({ ...prev, proofPhoto: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    // Submit Proof of Ownership Claim
    const handleSubmitClaim = async (e) => {
        e.preventDefault();
        setClaimError('');

        if (!token) {
            setClaimItem(null);
            setBlockedAction('submit proof of ownership');
            setShowLoginModal(true);
            return;
        }

        if (!proofForm.proofDescription.trim() || proofForm.proofDescription.trim().length < 8) {
            setClaimError('Please provide detailed identifying marks (at least 8 characters describing unique scratches, stickers, serial number, or contents).');
            return;
        }

        if (!proofForm.contactNumber.trim() || proofForm.contactNumber.trim().length < 8) {
            setClaimError('Please provide a valid contact/WhatsApp phone number so the finder or campus security can reach you.');
            return;
        }

        if (!proofForm.declaredTrue) {
            setClaimError('You must agree to the PICT Honor Code declaration to submit your claim.');
            return;
        }

        try {
            setSubmittingClaim(true);
            const res = await fetch(`/api/lostfound/${claimItem.id}/claim`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    proofDescription: proofForm.proofDescription.trim(),
                    dateLost: proofForm.dateLost,
                    locationLost: proofForm.locationLost,
                    contactNumber: proofForm.contactNumber.trim(),
                    studentRoll: proofForm.studentRoll.trim(),
                    studentDept: proofForm.studentDept.trim(),
                    proofPhoto: proofForm.proofPhoto,
                    claimantName: user?.username || user?.name || 'Verified Student'
                })
            });

            // If token expired or invalid (401), clean up session and show login modal
            if (res.status === 401) {
                if (logout) logout();
                setClaimItem(null);
                setBlockedAction('verify your identity (your session expired)');
                setShowLoginModal(true);
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setSuccessMsg(`🎉 Proof of ownership submitted for "${claimItem.name}"! Marked as claimed pending verification.`);
                setTimeout(() => setSuccessMsg(''), 6000);
                setClaimItem(null);
                setSelectedItem(null);
                fetchItems();
            } else {
                setClaimError(data.message || 'Failed to submit ownership claim.');
            }
        } catch (err) {
            console.error(err);
            setClaimError('Network connection error while submitting claim.');
        } finally {
            setSubmittingClaim(false);
        }
    };

    const filtered = items.filter((item) => {
        const matchSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
        const matchLocation =
    !locationFilter ||
    item.location.toLowerCase().includes(locationFilter.toLowerCase());

const matchStatus =
    !statusFilter || item.status === statusFilter;

return matchSearch && matchLocation && matchStatus;
    });

    return (
        <div className="lostfound-page">
            <div className="lostfound-header">
                <div>
                    <button
                        type="button"
                        className="back-home-link"
                        onClick={() => navigate('/')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: 'var(--primary, #2563eb)',
                            marginBottom: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Home
                    </button>
                    <h1>🔍 Campus Lost &amp; Found</h1>
                    <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '0.95rem', margin: '4px 0 0' }}>
                        Recover your lost belongings or report items found around PICT campus
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        className="report-btn"
                        onClick={() => {
                            if (!token) {
                                setBlockedAction('report a found item');
                                setShowLoginModal(true);
                                return;
                            }
                            navigate('/lostfound-item');
                        }}
                    >
                        + Report Found Item
                    </button>
                    <button
                        className="report-btn"
                        style={{ background: '#ffffff', color: 'var(--text-primary, #0f172a)', border: '1px solid var(--border-subtle, #e2e8f0)', boxShadow: 'var(--shadow-xs)' }}
                        onClick={() => navigate('/profile')}
                    >
                        👤 Profile &amp; Activity
                    </button>
                </div>
            </div>

            {/* Success message banner */}
            {successMsg && (
                <div className="lostfound-success-banner" style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.5)',
                    color: '#047857',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg('')} style={{ color: '#047857', fontSize: '18px', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {/* Search & Location Filter */}
            <div className="lostfound-controls">
                <input
                    type="text"
                    placeholder="Search for ID card, keys, bottle, umbrella, earphones, calculator..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                    <option value="">All Locations</option>
                    <option value="Library">Library &amp; Reading Hall</option>
                    <option value="Canteen">Canteen &amp; Quad</option>
                    <option value="Lab">Computer &amp; Electronics Labs</option>
                    <option value="Hostel">Hostels &amp; Parking</option>
                    <option value="Classroom">Classroom Buildings (A-F)</option>
                    <option value="Sports">Sports Ground / Gymkhana</option>
                </select>
                <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
>
    <option value="">All Items</option>
    <option value="unclaimed">🟡 Unclaimed</option>
    <option value="claimed">✅ Claimed</option>
</select>
            </div>

            {/* Items Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 12px' }} />
                    <p>Loading lost &amp; found items...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '2.5rem' }}>🧭</span>
                    <h3 style={{ margin: '12px 0 6px', color: '#0f172a' }}>No items found</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {search || locationFilter || statusFilter ? 'Try clearing your search or filters.' : 'No items reported yet.'}
                    </p>
                </div>
            ) : (
                <div className="lostfound-grid">
                    {filtered.map((item) => (
                        <div key={item.id} className="lostfound-card">
                            <img
                                src={item.photo || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop'}
                                alt={item.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop';
                                }}
                            />
                            <span className={`status-pill ${item.status}`}>
                                {item.status === 'unclaimed' ? '🟡 Unclaimed' : '✅ Claimed'}
                            </span>
                            <h3>{item.name}</h3>
                            <div className="location-tag">📍 {item.location}</div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px' }}>
                                📅 {item.date} • By @{item.reportedByUsername || 'Student'}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                <button
                                    onClick={() => setSelectedItem(item)}
                                    style={{
                                        flex: 1,
                                        padding: '9px',
                                        borderRadius: '10px',
                                        background: 'rgba(37, 99, 235, 0.1)',
                                        color: '#2563eb',
                                        border: '1px solid rgba(191, 219, 254, 0.8)',
                                        cursor: 'pointer',
                                        fontWeight: '700'
                                    }}
                                >
                                    Details
                                </button>
                                {item.status === 'unclaimed' ? (
                                    <button
                                        onClick={() => openClaimModal(item)}
                                        style={{
                                            flex: 1,
                                            padding: '9px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                                        }}
                                    >
                                        🛡️ Claim
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        style={{
                                            flex: 1,
                                            padding: '9px',
                                            borderRadius: '10px',
                                            background: '#f1f5f9',
                                            color: '#94a3b8',
                                            border: '1px solid #e2e8f0',
                                            cursor: 'not-allowed',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Claimed
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── 1. PROOF OF OWNERSHIP CLAIM MODAL ── */}
            {claimItem && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '16px',
                        animation: 'modalFadeIn 0.2s ease forwards'
                    }}
                    onClick={() => !submittingClaim && setClaimItem(null)}
                >
                    <div
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.9)',
                            maxWidth: '560px',
                            width: '100%',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            padding: '28px 24px',
                            boxShadow: '0 25px 60px -12px rgba(30, 64, 175, 0.2), inset 0 1px 1px #ffffff',
                            position: 'relative',
                            color: '#0f172a'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            style={{
                                position: 'absolute',
                                top: '18px',
                                right: '18px',
                                border: 'none',
                                background: 'rgba(241, 245, 249, 0.8)',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#64748b'
                            }}
                            onClick={() => !submittingClaim && setClaimItem(null)}
                        >
                            ×
                        </button>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                color: '#fff',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                            }}>
                                🛡️
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                                    Proof of Ownership
                                </h2>
                                <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '600' }}>
                                    Anti-Theft &amp; Verification Protocol
                                </span>
                            </div>
                        </div>

                        {/* Item Quick Overview Bar */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            background: '#f0f7ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '14px',
                            padding: '12px',
                            margin: '16px 0 18px',
                            alignItems: 'center'
                        }}>
                            <img
                                src={claimItem.photo || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop'}
                                alt={claimItem.name}
                                style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '750', fontSize: '0.96rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {claimItem.name}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                                    📍 Found: {claimItem.location} • 📅 {claimItem.date}
                                </div>
                            </div>
                        </div>

                        {/* Anti-Theft Security Notice */}
                        <div style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            fontSize: '0.8rem',
                            color: '#92400e',
                            lineHeight: '1.45',
                            marginBottom: '18px'
                        }}>
                            🔒 <strong>Security Warning:</strong> To protect student property from false or unauthorized claims, you must provide verifiable proof of ownership. The finder and campus authority will verify these details before releasing custody.
                        </div>

                        {/* Claim Error Banner */}
                        {claimError && (
                            <div style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                fontSize: '0.82rem',
                                color: '#b91c1c',
                                marginBottom: '16px',
                                fontWeight: '600'
                            }}>
                                ⚠️ {claimError}
                            </div>
                        )}

                        {/* Proof Submission Form */}
                        <form onSubmit={handleSubmitClaim}>
                            {/* 1. Distinguishing Identification Details */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '750', color: '#0f172a', marginBottom: '6px' }}>
                                    1. Distinguishing Identification Marks / Hidden Features <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.88rem',
                                        outline: 'none',
                                        color: '#0f172a',
                                        background: '#fff',
                                        lineHeight: '1.4'
                                    }}
                                    placeholder="Describe unique scratches, stickers, custom lock screen, engraving, contents, brand model, or serial numbers that only the rightful owner would know..."
                                    value={proofForm.proofDescription}
                                    onChange={(e) => setProofForm({ ...proofForm, proofDescription: e.target.value })}
                                    required
                                />
                            </div>

                            {/* 2. When & Where was it lost */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                                        Approx. Date Lost <span style={{ color: '#dc2626' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '0.85rem',
                                            outline: 'none'
                                        }}
                                        value={proofForm.dateLost}
                                        onChange={(e) => setProofForm({ ...proofForm, dateLost: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                                        Specific Area Lost
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Table 14 Reading Hall"
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '0.85rem',
                                            outline: 'none'
                                        }}
                                        value={proofForm.locationLost}
                                        onChange={(e) => setProofForm({ ...proofForm, locationLost: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* 3. Claimant Contact & Roll Number */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                                        Your Phone / WhatsApp <span style={{ color: '#dc2626' }}>*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. 9876543210"
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '0.85rem',
                                            outline: 'none'
                                        }}
                                        value={proofForm.contactNumber}
                                        onChange={(e) => setProofForm({ ...proofForm, contactNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                                        Roll No / Student ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 31245 / TE-COMP"
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '0.85rem',
                                            outline: 'none'
                                        }}
                                        value={proofForm.studentRoll}
                                        onChange={(e) => setProofForm({ ...proofForm, studentRoll: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* 4. Optional Photo Proof / Receipt Upload */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                                    Upload Photo Proof / Receipt / Matching ID (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProofPhotoUpload}
                                    style={{
                                        width: '100%',
                                        fontSize: '0.82rem',
                                        color: '#475569',
                                        padding: '6px 0'
                                    }}
                                />
                                {proofForm.proofPhoto && (
                                    <div style={{ marginTop: '8px' }}>
                                        <img
                                            src={proofForm.proofPhoto}
                                            alt="Proof preview"
                                            style={{ height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 5. Honor Code Declaration */}
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'flex-start',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '12px',
                                marginBottom: '20px'
                            }}>
                                <input
                                    type="checkbox"
                                    id="honorDeclaration"
                                    checked={proofForm.declaredTrue}
                                    onChange={(e) => setProofForm({ ...proofForm, declaredTrue: e.target.checked })}
                                    style={{ marginTop: '3px', cursor: 'pointer' }}
                                    required
                                />
                                <label htmlFor="honorDeclaration" style={{ fontSize: '0.78rem', color: '#334155', lineHeight: '1.4', cursor: 'pointer' }}>
                                    I declare under the <strong>PICT Student Honor Code</strong> that this item belongs to me. I acknowledge that submitting fraudulent claims for lost/stolen property is a disciplinary violation and will be referred to campus security.
                                </label>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    disabled={submittingClaim}
                                    onClick={() => setClaimItem(null)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                        color: '#475569',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingClaim}
                                    style={{
                                        flex: 2,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: submittingClaim ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                        color: '#fff',
                                        fontWeight: '750',
                                        fontSize: '0.92rem',
                                        cursor: submittingClaim ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)'
                                    }}
                                >
                                    {submittingClaim ? 'Verifying & Submitting...' : '🛡️ Submit Proof & Claim'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── 2. DETAILS MODAL ── */}
            {selectedItem && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '16px'
                    }}
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '24px',
                            maxWidth: '520px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '24px 20px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                border: 'none',
                                background: '#f1f5f9',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                color: '#64748b'
                            }}
                            onClick={() => setSelectedItem(null)}
                        >
                            ×
                        </button>
                        <img
                            src={selectedItem.photo || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop'}
                            alt={selectedItem.name}
                            style={{ width: '100%', height: '190px', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px' }}
                        />
                        <h2 style={{ fontSize: '1.3rem', color: '#0f172a', margin: '0 0 8px', fontWeight: '800' }}>{selectedItem.name}</h2>
                        
                        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
                            {selectedItem.description || 'No description provided.'}
                        </p>

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px', fontSize: '13px', color: '#334155', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div>📍 <strong>Found at:</strong> {selectedItem.location}</div>
                            <div>📅 <strong>Date:</strong> {selectedItem.date}</div>
                            <div>👤 <strong>Reported by:</strong> @{selectedItem.reportedByUsername || 'Student'}</div>
                            <div>📞 <strong>Contact:</strong> {selectedItem.contact}</div>
                            <div>🏷️ <strong>Status:</strong> {selectedItem.status === 'unclaimed' ? '🟡 Unclaimed' : '✅ Claimed (Pending Verification)'}</div>
                        </div>

                        {/* If claimed and viewer is reporter or claimant, show proof info */}
                        {selectedItem.status === 'claimed' && selectedItem.proofOfOwnership && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '14px', fontSize: '13px', color: '#166534', marginBottom: '16px' }}>
                                <div style={{ fontWeight: '750', marginBottom: '6px', fontSize: '0.88rem' }}>🛡️ Proof of Ownership Submitted:</div>
                                <div><strong>Claimant:</strong> @{selectedItem.claimedByUsername || selectedItem.proofOfOwnership.claimantName}</div>
                                <div><strong>Contact:</strong> {selectedItem.proofOfOwnership.contactNumber}</div>
                                {selectedItem.proofOfOwnership.studentRoll && (
                                    <div><strong>Roll / PRN:</strong> {selectedItem.proofOfOwnership.studentRoll}</div>
                                )}
                                <div><strong>Identifying Marks:</strong> {selectedItem.proofOfOwnership.description}</div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {selectedItem.status === 'unclaimed' && (
                                <button
                                    style={{
                                        flex: 1,
                                        minWidth: '140px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#fff',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                                    }}
                                    onClick={() => {
                                        setSelectedItem(null);
                                        openClaimModal(selectedItem);
                                    }}
                                >
                                    🛡️ This is Mine (Claim with Proof)
                                </button>
                            )}
                            <a
                                href={`tel:${selectedItem.contact}`}
                                style={{
                                    flex: 1,
                                    minWidth: '120px',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    color: '#334155',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                📞 Call Reporter
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 3. LOGIN PROMPT MODAL ── */}
            {showLoginModal && (
                <LoginPromptModal
                    serviceName="Lost &amp; Found"
                    serviceIcon="🔍"
                    isActionBlocked={!!blockedAction}
                    actionText={blockedAction || 'access this service'}
                    onClose={() => {
                        setShowLoginModal(false);
                        setBlockedAction(null);
                    }}
                />
            )}
        </div>
    );
};

export default LostFound;