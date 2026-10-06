import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, X, User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBrokerPermissions } from '../../hooks/useBrokerPermissions';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Toast from '../../components/common/Toast';
import * as api from '../../services/api';

const UsersPage = ({ onNavigate, roleFilter }) => {
    const navigate = useNavigate();
    const { isSuperAdmin, isAdmin, user, isBroker } = useAuth();
    const { permissions } = useBrokerPermissions(user?.userId, user?.role);
    const [filters, setFilters] = useState({ username: '', status: '' });
    const [resetModal, setResetModal] = useState({ open: false, user: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
    const [toast, setToast] = useState({ message: '', type: 'success' });
    const [usersData, setUsersData] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState('');
    const [adminList, setAdminList] = useState([]);
    const [loading, setLoading] = useState(false);

    const roleLabel = roleFilter === 'ADMIN' ? 'Admin' : 'Broker';

    useEffect(() => {
        fetchUsers();
        if (roleFilter === 'BROKER' && isSuperAdmin()) {
            fetchAdmins();
        }
    }, [roleFilter]);

    const fetchAdmins = async () => {
        try {
            const data = await api.getClients({ role: 'ADMIN' });
            setAdminList(data || []);
        } catch (err) {
            console.error('Failed to fetch admin list:', err);
        }
    };

    const fetchUsers = async (overrideAdminId) => {
        setLoading(true);
        try {
            console.log(`[UsersPage] Fetching ${roleFilter}s...`);
            const params = { role: roleFilter };
            const activeAdminId = overrideAdminId !== undefined ? overrideAdminId : selectedAdmin;
            if (roleFilter === 'BROKER' && isSuperAdmin() && activeAdminId) {
                params.adminId = activeAdminId;
            }
            const data = await api.getClients(params);
            console.log(`[UsersPage] ✅ Received ${data?.length || 0} ${roleFilter}s:`, data);
            setUsersData(data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const toggleStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            await api.updateUserStatus(userId, newStatus);
            setToast({ message: `Status updated to ${newStatus}`, type: 'success' });
            fetchUsers();
        } catch (err) {
            setToast({ message: 'Failed to update status', type: 'error' });
        }
    };

    const openEditModal = (row) => {
        setEditForm({
            full_name: row.full_name || '',
            email: row.email || '',
            mobile: row.mobile || '',
            password: '',
        });
        setEditModal({ open: true, user: row });
    };

    const handleEditSave = async () => {
        setEditLoading(true);
        try {
            const payload = { full_name: editForm.full_name, email: editForm.email, mobile: editForm.mobile };
            if (editForm.password) payload.password = editForm.password;
            await api.updateUser(editModal.user.id, payload);
            setToast({ message: `${roleLabel} updated successfully`, type: 'success' });
            setEditModal({ open: false, user: null });
            fetchUsers();
        } catch (err) {
            setToast({ message: 'Failed to update: ' + err.message, type: 'error' });
        } finally {
            setEditLoading(false);
        }
    };

    const handleResetPassword = async () => {
        try {
            await api.resetPassword(resetModal.user?.id);
            setToast({ message: `Password reset for ${resetModal.user?.username}`, type: 'success' });
        } catch (err) {
            setToast({ message: 'Failed to reset password: ' + err.message, type: 'error' });
        } finally {
            setResetModal({ open: false, user: null });
        }
    };

    const handleDeleteUser = async () => {
        try {
            await api.deleteUser(deleteModal.user?.id);
            setToast({ message: `${roleLabel} ${deleteModal.user?.username} deleted successfully`, type: 'success' });
            fetchUsers();
        } catch (err) {
            setToast({ message: 'Failed to delete: ' + err.message, type: 'error' });
        } finally {
            setDeleteModal({ open: false, user: null });
        }
    };

    const columns = [
        { key: 'id', label: 'ID', width: '80px' },
        { key: 'username', label: 'Username', className: 'text-[#00BCD4] font-medium' },
        { key: 'full_name', label: 'Full Name' },
        {
            key: 'role', label: 'Role', render: (val) => (
                <span className={`badge ${val === 'BROKER' || val === 'ADMIN' ? 'badge-active' : 'badge-pending'}`}>{val}</span>
            )
        },
        {
            key: 'status', label: 'Status', render: (val, row) => (
                <button
                    onClick={() => toggleStatus(row.id, val)}
                    title={`Click to change to ${val === 'Active' ? 'Inactive' : 'Active'}`}
                    className={`badge ${val === 'Active' ? 'badge-active' : 'badge-inactive'} badge-interactive flex items-center gap-1.5`}
                >
                    <RotateCcw className="w-3 h-3 opacity-70" />
                    {val || 'Inactive'}
                </button>
            )
        },
        { key: 'created_at', label: 'Created At', render: (val) => val ? new Date(val).toLocaleString() : '-' },
    ];

    const actions = {
        onView: (row) => {
            if (roleFilter === 'BROKER') {
                onNavigate('brokers/view/' + row.id, row);
            } else {
                onNavigate('admins/view/' + row.id, row);
            }
        },
        onEdit: (row) => {
            if (roleFilter === 'BROKER') {
                onNavigate('brokers/edit/' + row.id, row);
            } else {
                onNavigate('admins/edit/' + row.id, row);
            }
        },
        onDelete: (row) => setDeleteModal({ open: true, user: row }),
    };

    const filteredUsers = usersData.filter(u => {
        const matchUser = filters.username ? u.username.toLowerCase().includes(filters.username.toLowerCase()) : true;
        const matchStatus = filters.status ? u.status === filters.status : true;
        const matchRole = roleFilter ? u.role === roleFilter : true;

        // If broker viewing brokers, only show their own sub-brokers
        if (isBroker() && roleFilter === 'BROKER') {
            const isSubBroker = u.parent_id === user?.userId;
            console.log(`[UsersPage] Broker: ${u.username}, parent_id: ${u.parent_id}, current user: ${user?.userId}, match: ${isSubBroker}`);
            return matchUser && matchStatus && matchRole && isSubBroker;
        }

        return matchUser && matchStatus && matchRole;
    });

    return (
        <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', overflowX: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Filters */}
            <div className="custom-filter">
                <div 
                    className="custom-filter-grid" 
                    style={{ 
                        gridTemplateColumns: roleFilter === 'BROKER' && isSuperAdmin() ? '1fr 1fr 1fr' : '1fr 1fr', 
                        maxWidth: roleFilter === 'BROKER' && isSuperAdmin() ? '900px' : '700px', 
                        gap: '30px' 
                    }}
                >
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={filters.username}
                            onChange={handleFilterChange}
                            placeholder="Search username..."
                            className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-white/20 focus:border-[#5cb85c] transition-colors"
                        />
                        <div className="action-row" style={{ marginTop: '24px' }}>
                            <button onClick={() => fetchUsers()} className="btn-primary btn-success-gradient">
                                SEARCH
                            </button>
                            <button
                                onClick={() => { 
                                    setFilters({ username: '', status: '' }); 
                                    setSelectedAdmin('');
                                    fetchUsers(''); 
                                }}
                                className="btn-secondary"
                                style={{ background: '#808080', borderColor: '#808080', color: 'white' }}
                            >
                                <RotateCcw className="w-4 h-4" /> RESET
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">Account Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="bg-white text-slate-900 w-full px-4 py-2 rounded border border-slate-300 text-sm outline-none cursor-pointer"
                        >
                            <option value="">All</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Active">Active</option>
                        </select>
                    </div>

                    {roleFilter === 'BROKER' && isSuperAdmin() && (
                        <div>
                            <label className="block text-sm text-slate-300 mb-2">Select Admin</label>
                            <select
                                name="selectedAdmin"
                                value={selectedAdmin}
                                onChange={(e) => {
                                    const newAdminId = e.target.value;
                                    setSelectedAdmin(newAdminId);
                                    fetchUsers(newAdminId);
                                }}
                                className="bg-white text-slate-900 w-full px-4 py-2 rounded border border-slate-300 text-sm outline-none cursor-pointer"
                            >
                                <option value="">My Brokers (Default)</option>
                                <option value="all">All Admins' Brokers</option>
                                {adminList.map(adm => (
                                    <option key={adm.id} value={adm.id}>
                                        {adm.username} ({adm.full_name || 'Admin'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Add buttons */}
            <div className="action-row">
                {roleFilter === 'ADMIN' && isSuperAdmin() && (
                    <button onClick={() => onNavigate('admins/create')} className="btn-primary btn-success-gradient">
                        ADD ADMIN
                    </button>
                )}
                {roleFilter === 'BROKER' && !user?.isSubBroker && (isAdmin() || (user?.role === 'BROKER' && permissions.subBrokerActions === 'Yes')) && (
                    <button onClick={() => onNavigate('brokers/create')} className="btn-primary btn-success-gradient">
                        ADD BROKER
                    </button>
                )}
            </div>

            {/* Table */}
            <div style={{ paddingBottom: '40px' }}>
                {loading ? (
                    <div className="loading-overlay">Loading {roleLabel}s...</div>
                ) : filteredUsers.length > 0 ? (
                    <DataTable columns={columns} data={filteredUsers} actions={actions} searchable={false} emptyMessage={`${roleLabel}s Not Found`} />
                ) : (
                    <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>{roleLabel}s Not Found</div>
                )}
            </div>



            <ConfirmModal
                isOpen={resetModal.open}
                onClose={() => setResetModal({ open: false, user: null })}
                onConfirm={handleResetPassword}
                title="Reset Password"
                message={`Are you sure you want to reset the password for "${resetModal.user?.username}"?`}
                confirmText="Reset Password"
                type="warning"
            />

            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, user: null })}
                onConfirm={handleDeleteUser}
                title={`Delete ${roleLabel}`}
                message={`Are you sure you want to delete ${roleLabel.toLowerCase()} "${deleteModal.user?.username}"? This action cannot be undone.`}
                confirmText={`Delete ${roleLabel}`}
                type="danger"
            />

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: '', type: 'success' })}
            />
        </div>
    );
};

export default UsersPage;
