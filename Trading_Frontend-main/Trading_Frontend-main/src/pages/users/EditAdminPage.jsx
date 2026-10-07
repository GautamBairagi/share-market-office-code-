import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleAddUserForm from '../../components/SimpleAddUserForm';
import * as api from '../../services/api';

const EditAdminPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [adminData, setAdminData] = useState(null);
    const [menuPerms, setMenuPerms] = useState([]);
    const [panelColors, setPanelColors] = useState(null);
    const [panelLogoPath, setPanelLogoPath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [users, permsRes, panelRes] = await Promise.all([
                    api.getClients({ role: 'ADMIN' }),
                    api.getAdminMenuPermissions(id),
                    api.getAdminPanelSettings(id),
                ]);

                const admin = (users || []).find(u => String(u.id) === String(id));
                if (!admin) throw new Error('Admin not found');
                setAdminData(admin);

                setMenuPerms(permsRes?.menuPermissions || []);

                if (panelRes?.theme && Object.keys(panelRes.theme).length) {
                    setPanelColors(panelRes.theme);
                }
                if (panelRes?.logoPath) {
                    setPanelLogoPath(panelRes.logoPath);
                }
            } catch (err) {
                setError(err.message || 'Failed to load admin data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Loading admin details...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                    onClick={() => navigate('/admins')}
                    className="text-xs px-4 py-2 rounded text-white"
                    style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                >
                    Back to Admins
                </button>
            </div>
        );
    }

    return (
        <SimpleAddUserForm
            role="Admin"
            editMode={true}
            initialData={adminData}
            initialPerms={menuPerms}
            initialColors={panelColors}
            initialLogoPath={panelLogoPath}
            onBack={() => navigate('/admins')}
            onSave={() => navigate('/admins')}
        />
    );
};

export default EditAdminPage;
