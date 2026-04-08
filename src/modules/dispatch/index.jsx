import React, { useState, useEffect } from 'react';
import { Package, Warehouse, Truck, ClipboardList, Plus, RefreshCw, X } from 'lucide-react';
import { Button, Spinner } from '../../shared/components';
import { formatCurrency } from '../../shared/utils/formatters';
import useDispatchBoard from './hooks/useDispatchBoard';
import useTripActions from './hooks/useTripActions';
import useLegActions from './hooks/useLegActions';
import AvailableLoadsPanel from './components/AvailableLoadsPanel';
import OnDockPanel from './components/OnDockPanel';
import EnroutePanel from './components/EnroutePanel';
import TripsPanel from './components/TripsPanel';
import TripManifest from './components/TripManifest';
import TripHistoryTab from './components/TripHistoryTab';
import CreateTripModal from './components/CreateTripModal';
import { LoadModal } from '../loads/Loads';
import api from '../../shared/services/api';
import toast from 'react-hot-toast';
import './dispatch.css';

export default function DispatchPage() {
  const {
    board, loading, selectedTrip, selectTrip,
    refresh, refreshTrip, activeTab, setActiveTab,
  } = useDispatchBoard();
  const tripActions = useTripActions(refresh, refreshTrip);
  const legActions = useLegActions(refreshTrip);
  const [dateFilter, setDateFilter] = useState('today');
  const [showCreate, setShowCreate] = useState(false);
  const [editLoad, setEditLoad] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalLoad, setModalLoad] = useState(null);
  const [modalLoadFull, setModalLoadFull] = useState(null);
  const [truckCount, setTruckCount] = useState(0);
  const [trailerCount, setTrailerCount] = useState(0);

  // Fetch full load data when modal opens
  useEffect(() => {
    if (!modalLoad?.id) { setModalLoadFull(null); return; }
    setModalLoadFull(modalLoad); // show partial data immediately
    api.get(`/loads/${modalLoad.id}`)
      .then(r => setModalLoadFull(r.data || r))
      .catch(() => setModalLoadFull(modalLoad));
  }, [modalLoad]);

  useEffect(() => {
    api.get('/fleet', { params: { status: 'active', type: 'truck' } })
      .then(r => setTruckCount((r.data || r || []).length || 0)).catch(() => {});
    api.get('/fleet', { params: { status: 'active', type: 'trailer' } })
      .then(r => setTrailerCount((r.data || r || []).length || 0)).catch(() => {});
  }, []);

  const { available, onDock, enroute, trips, stats } = board;

  // Filter loads by search
  const filterLoads = (loads) => {
    if (!searchText || searchText.length < 2) return loads;
    const s = searchText.toLowerCase();
    return loads.filter(l =>
      (l.load_number || '').toLowerCase().includes(s) ||
      (l.customer_name || '').toLowerCase().includes(s) ||
      (l.origin_city || '').toLowerCase().includes(s) ||
      (l.dest_city || '').toLowerCase().includes(s)
    );
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleStatusChange = async (loadId, newStatus) => {
    try {
      await api.put(`/loads/${loadId}/status`, { status: newStatus });
      refresh();
      toast.success(`Status → ${newStatus.replace('_', ' ')}`);
    } catch (e) {
      toast.error(e.message || 'Status update failed');
    }
  };

  const loadActions = {
    onViewLoad: (load) => setModalLoad(load),
    onEditLoad: (load) => setEditLoad(load),
    onCreateTrip: (type, ids) => setShowCreate(type || true),
    onCopyLoadNum: (load) => {
      navigator.clipboard.writeText(load.load_number).then(() => toast.success(`Copied ${load.load_number}`));
    },
    onStatusChange: handleStatusChange,
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div className="dispatch-page">
      {/* Stats bar */}
      <div className="dispatch-stats-bar">
        <StatItem icon={Package} label="Available" value={available.length} />
        <StatItem icon={Warehouse} label="On Dock" value={onDock.length} />
        <StatItem icon={Truck} label="Enroute" value={enroute.length} />
        <StatItem icon={ClipboardList} label="Delivered" value={stats.delivered_today || 0} />
        <div className="dispatch-stat revenue">
          <span>Revenue Today</span>
          <span className="stat-value">{formatCurrency(stats.revenue_today)}</span>
        </div>
        <div className="dispatch-actions">
          <button className="dispatch-filter-btn" title="Trucks Available">🚛 Trucks: {truckCount}</button>
          <button className="dispatch-filter-btn" title="Trailers Available">🚛 Trailers: {trailerCount}</button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          {['today', 'tomorrow', 'all'].map((f) => (
            <button key={f} className={`dispatch-filter-btn ${dateFilter === f ? 'active' : ''}`}
              onClick={() => setDateFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> New Trip</Button>
          <Button size="sm" variant="ghost" onClick={refresh}><RefreshCw size={14} /></Button>
        </div>
      </div>

      {/* Search bar + tabs */}
      <div className="dispatch-search">
        <input placeholder="Search loads..." value={searchText}
          onChange={e => setSearchText(e.target.value)} />
        <div style={{ display: 'flex', gap: 0 }}>
          <div className={`dispatch-tab ${activeTab === 'board' ? 'active' : ''}`}
            onClick={() => setActiveTab('board')}>Board</div>
          <div className={`dispatch-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}>History</div>
        </div>
      </div>

      {/* Bulk selection bar */}
      {selectedIds.length > 0 && (
        <div className="dispatch-bulk-bar">
          <span>{selectedIds.length} load{selectedIds.length > 1 ? 's' : ''} selected</span>
          <Button size="sm" variant="success" onClick={() => setShowCreate(true)}>Assign All to Trip</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear Selection</Button>
        </div>
      )}

      {activeTab === 'history' ? (
        <TripHistoryTab />
      ) : (
        <div className="dispatch-body">
          <div className="dispatch-panels">
            <AvailableLoadsPanel loads={filterLoads(available)} onRefresh={refresh}
              onCreateTrip={loadActions.onCreateTrip} loadActions={loadActions}
              selectedIds={selectedIds} onToggleSelect={toggleSelect}
              onStatusChange={handleStatusChange} onClickLoad={setModalLoad} />
            <OnDockPanel loads={filterLoads(onDock)} onRefresh={refresh} selectedTrip={selectedTrip}
              tripActions={tripActions} loadActions={loadActions}
              selectedIds={selectedIds} onToggleSelect={toggleSelect}
              onStatusChange={handleStatusChange} onClickLoad={setModalLoad} />
            <EnroutePanel loads={filterLoads(enroute)} onSelectTrip={selectTrip} loadActions={loadActions}
              onStatusChange={handleStatusChange} onClickLoad={setModalLoad} />
            <TripsPanel trips={trips} onSelectTrip={selectTrip}
              selectedTripId={selectedTrip?.id} />
          </div>
          {selectedTrip && (
            <>
              <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1999 }}
                onClick={() => selectTrip(null)} />
              <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
                width:800,maxWidth:'90vw',height:'85vh',zIndex:2000,
                background:'#fff',borderRadius:8,boxShadow:'0 8px 40px rgba(0,0,0,0.3)',
                overflow:'hidden',display:'flex',flexDirection:'column' }}>
                <TripManifest trip={selectedTrip} tripActions={tripActions}
                  legActions={legActions} onClose={() => selectTrip(null)}
                  available={available} onDock={onDock} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Load Detail Center Modal */}
      {modalLoad && modalLoadFull && (
        <div className="dispatch-modal-overlay" onClick={e => e.target === e.currentTarget && setModalLoad(null)}>
          <div className="dispatch-modal">
            <div className="dispatch-modal-header">
              <h3>{modalLoadFull.load_number} — {modalLoadFull.customer_name}</h3>
              <button onClick={() => setModalLoad(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}><X size={18} /></button>
            </div>
            <div className="dispatch-modal-body">
              {(() => {
                const m = modalLoadFull;
                const stops = Array.isArray(m.stops) ? m.stops : [];
                const shipper = stops.find(s => s.stop_type === 'shipper' || s.stop_type === 'pickup') || stops[0] || {};
                const consignee = stops.find(s => s.stop_type === 'consignee' || s.stop_type === 'delivery') || stops[stops.length - 1] || {};
                const pcs = Number(m.pieces) || Number(m.total_pieces) || 0;
                const wgt = Number(m.weight) || Number(m.total_weight) || 0;
                const rate = parseFloat(m.base_rate) || parseFloat(m.total_revenue) || 0;
                return (<>
                  {/* Header line */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#003865' }}>{m.load_number}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#E3F2FD', color: '#0063A3', fontWeight: 700, textTransform: 'uppercase' }}>{m.status}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#2E7D32' }}>{formatCurrency(rate)}</span>
                  </div>
                  {/* Pickup / Delivery */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#003865', textTransform: 'uppercase', marginBottom: 4 }}>Pickup</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{shipper.company_name || m.origin_city || '—'}</div>
                      {shipper.address && <div style={{ fontSize: 11, color: '#555' }}>{shipper.address}</div>}
                      <div style={{ fontSize: 11, color: '#555' }}>{shipper.city || m.origin_city || ''}{shipper.state ? ', ' + shipper.state : ''} {shipper.zip || ''}</div>
                      {m.pickup_date && <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>Date: {new Date(m.pickup_date).toLocaleDateString()}</div>}
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#003865', textTransform: 'uppercase', marginBottom: 4 }}>Delivery</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{consignee.company_name || m.dest_city || '—'}</div>
                      {consignee.address && <div style={{ fontSize: 11, color: '#555' }}>{consignee.address}</div>}
                      <div style={{ fontSize: 11, color: '#555' }}>{consignee.city || m.dest_city || ''}{consignee.state ? ', ' + consignee.state : ''} {consignee.zip || ''}</div>
                      {m.delivery_date && <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>Date: {new Date(m.delivery_date).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  {/* Freight + References */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#003865', textTransform: 'uppercase', marginBottom: 4 }}>Freight</div>
                      <div style={{ fontSize: 12, display: 'grid', gap: 3 }}>
                        <span>Commodity: <b>{m.commodity || '—'}</b></span>
                        <span>Pieces: <b>{pcs || '—'}</b></span>
                        <span>Weight: <b>{wgt ? wgt.toLocaleString() + ' lb' : '—'}</b></span>
                        <span>Equipment: <b>{m.equipment_type || 'Dry Van'}</b></span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#003865', textTransform: 'uppercase', marginBottom: 4 }}>References</div>
                      <div style={{ fontSize: 12, display: 'grid', gap: 3 }}>
                        <span>Customer: <b>{m.customer_name || '—'}</b></span>
                        {(m.customer_ref || m.ref_number || m.po_number) && <span>Ref #: <b>{m.customer_ref || m.ref_number || m.po_number}</b></span>}
                        <span>Load #: <b>{m.load_number}</b></span>
                        <span>Rate: <b>{formatCurrency(rate)}</b></span>
                      </div>
                    </div>
                  </div>
                  {m.is_cross_border && <div style={{ fontSize: 11, color: '#0063A3', marginBottom: 8 }}>🌎 Cross-border shipment</div>}
                </>);
              })()}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Button size="sm" onClick={() => { setModalLoad(null); setEditLoad(modalLoadFull); }}>Edit Load</Button>
                <Button size="sm" variant="secondary" onClick={() => { setModalLoad(null); setShowCreate(true); }}>Create Trip</Button>
                {modalLoadFull.status === 'available' && (
                  <Button size="sm" variant="success" onClick={() => { handleStatusChange(modalLoadFull.id, 'on_dock'); setModalLoad(null); }}>Pickup Done → On Dock</Button>
                )}
                {modalLoadFull.status === 'on_dock' && (
                  <Button size="sm" variant="warning" onClick={() => { handleStatusChange(modalLoadFull.id, 'en_route'); setModalLoad(null); }}>Depart → En Route</Button>
                )}
                {modalLoadFull.status === 'en_route' && (
                  <Button size="sm" variant="success" onClick={() => { handleStatusChange(modalLoadFull.id, 'delivered'); setModalLoad(null); }}>Delivered ✓</Button>
                )}
                {(modalLoadFull.status === 'on_dock' || modalLoadFull.status === 'en_route' || modalLoadFull.status === 'delivered') && (
                  <Button size="sm" variant="ghost" onClick={() => {
                    const rev = { on_dock: 'available', en_route: 'on_dock', delivered: 'on_dock' };
                    handleStatusChange(modalLoadFull.id, rev[modalLoadFull.status]);
                    setModalLoad(null);
                  }}>Reverse Status</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateTripModal open onClose={() => setShowCreate(false)}
          available={available} onDock={onDock}
          onCreate={async (data) => { await tripActions.createTrip(data); setShowCreate(false); }} />
      )}

      <LoadModal open={!!editLoad} onClose={() => { setEditLoad(null); refresh(); }} editing={editLoad} />
    </div>
  );
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="dispatch-stat">
      <Icon size={14} />
      <span>{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
