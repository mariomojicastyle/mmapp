import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  Settings,
  LogOut,
  Search,
  Plus,
  Filter,
  ArrowUpRight,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react';
import { supabase } from './lib/supabase';

const App = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'new'
  });

  // Mock data for initial WOW factor
  const mockLeads = [
    { id: 1, name: 'Mario Mojica', email: 'mario@example.com', company: 'MMA Corp', status: 'new', phone: '+57 300...' },
    { id: 2, name: 'DeepMind Tech', email: 'contact@deepmind.com', company: 'Google', status: 'pending', phone: '+1 650...' },
    { id: 3, name: 'Hetzner Cloud', email: 'support@hetzner.com', company: 'Hetzner', status: 'new', phone: '+49 9831...' },
  ];

  const fetchLeads = async () => {
    try {
      setLoading(true);
      if (supabase) {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setLeads(data || []);
      } else {
        setLeads(mockLeads);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.message);
      setLeads(mockLeads);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      if (!supabase) {
        // Demo mode: just add to local state
        const demoLead = { ...newLead, id: Date.now(), created_at: new Date().toISOString() };
        setLeads([demoLead, ...leads]);
        setIsModalOpen(false);
        setNewLead({ name: '', company: '', email: '', phone: '', status: 'new' });
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select();

      if (error) throw error;

      setLeads([data[0], ...leads]);
      setIsModalOpen(false);
      setNewLead({ name: '', company: '', email: '', phone: '', status: 'new' });
    } catch (err) {
      alert('Error al crear el lead: ' + err.message);
    }
  };

  const filteredLeads = leads.filter(lead =>
    (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (lead.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="premium-container">
      {/* Header Section */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.025em' }}>
            B2B <span style={{ color: 'var(--primary)' }}>Hub</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Bienvenido de nuevo al panel de administración.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Nuevo Lead</button>
          <div className="glass-card" style={{ padding: '0.5rem', display: 'flex', borderRadius: '0.75rem' }}>
            <Settings size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="lead-grid" style={{ marginBottom: '3rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Leads</p>
          <h2 style={{ fontSize: '1.5rem' }}>{leads.length}</h2>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #22c55e' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nuevos Hoy</p>
          <h2 style={{ fontSize: '1.5rem' }}>{leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length || 0}</h2>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #eab308' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Conversión</p>
          <h2 style={{ fontSize: '1.5rem' }}>12.5%</h2>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar leads por nombre o empresa..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.5rem', color: 'white' }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="glass-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)' }}>
          <Filter size={18} /> Filtrar
        </button>
      </div>

      {/* Leads Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Cargando leads...</div>
      ) : (
        <div className="lead-grid">
          <AnimatePresence>
            {filteredLeads.map((lead, index) => (
              <motion.div
                key={lead.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <span className={`status-badge status-${lead.status || 'new'}`}>{lead.status || 'new'}</span>
                  <ArrowUpRight size={18} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                </div>
                <h3 style={{ marginBottom: '0.25rem' }}>{lead.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <Briefcase size={14} /> {lead.company}
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <Mail size={14} style={{ color: 'var(--primary)' }} /> {lead.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <Phone size={14} style={{ color: 'var(--primary)' }} /> {lead.phone}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal for New Lead */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <motion.div
              className="glass-card modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '500px', border: '1px solid var(--primary-glow)' }}
            >
              <h2 style={{ marginBottom: '1.5rem' }}>Crear Nuevo Lead</h2>
              <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nombre Completo</label>
                  <input
                    type="text"
                    required
                    className="glass-input"
                    value={newLead.name}
                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Empresa / Proyecto</label>
                  <input
                    type="text"
                    required
                    className="glass-input"
                    value={newLead.company}
                    onChange={e => setNewLead({ ...newLead, company: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    className="glass-input"
                    value={newLead.email}
                    onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Teléfono</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={newLead.phone}
                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Lead</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
