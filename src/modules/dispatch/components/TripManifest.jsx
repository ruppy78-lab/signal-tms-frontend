import React, { useState } from 'react';
import { X, Save, Printer, Mail, Bell, Copy, XCircle, Plus, ArrowUpDown, Zap, Check } from 'lucide-react';
import { Button, Badge } from '../../../shared/components';
import { formatCurrency, formatDateTime, formatTime } from '../../../shared/utils/formatters';
import { tripTypeLabel } from '../../../shared/utils/helpers';
import { calculateDriverPay } from '../utils/tripCalculations';
import ManifestLoadRow from './ManifestLoadRow';
import LoadSelectionPopup from './LoadSelectionPopup';
import StopReorderPanel from './StopReorderPanel';
import PODUploadModal from './PODUploadModal';

export default function TripManifest({ trip, tripActions, legActions, onClose, available, onDock }) {
  const [form, setForm] = useState({});
  const [expandedLoad, setExpandedLoad] = useState(null);
  const [addType, setAddType] = useState(null);
  const [showReorder, setShowReorder] = useState(false);
  const [podLeg, setPodLeg] = useState(null);
  const [printMenu, setPrintMenu] = useState(false);
  if (!trip) return null;

  const uniqueLoads = [];
  const seen = new Set();
  for (const leg of (trip.legs || [])) {
    if (!seen.has(leg.load_id)) { seen.add(leg.load_id); uniqueLoads.push(leg); }
  }
  const allDone = (trip.legs || []).every(l => l.status === 'completed' || l.status === 'skipped');
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const f = (k) => form[k] ?? trip[k] ?? '';
  const estPay = calculateDriverPay(f('driver_pay_type'), f('driver_pay_rate'), f('estimated_miles'), trip.total_revenue, (trip.legs || []).length);

  const handleSave = () => tripActions.updateTrip(trip.id, { ...trip, ...form });
  const handleLegAction = async (legId, status) => await legActions.updateLegStatus(trip.id, legId, status);
  const handlePODComplete = async () => {
    if (podLeg) { await legActions.updateLegStatus(trip.id, podLeg.id, 'completed'); setPodLeg(null); }
  };

  return (
    <div>
      <div className="manifest-header">
        <span className="manifest-title">{trip.trip_number}</span>
        <Badge status={trip.status} />
        <Badge status={trip.trip_type} label={tripTypeLabel(trip.trip_type)} />
        <div style={{ flex: 1 }} />
        <div className="manifest-actions">
          <Button size="xs" onClick={handleSave}><Save size={12} /> Save</Button>
          <div style={{ position: 'relative' }}>
            <Button size="xs" variant="ghost" onClick={() => setPrintMenu(!printMenu)}><Printer size={12} /></Button>
            {printMenu && (
              <div className="print-dropdown">
                <div onClick={() => { window.print(); setPrintMenu(false); }}>Trip Sheet</div>
                {trip.carrier_id && <div onClick={() => setPrintMenu(false)}>Rate Confirmation</div>}
                <div onClick={() => setPrintMenu(false)}>Load Confirmation</div>
                <div onClick={() => setPrintMenu(false)}>BOL</div>
              </div>
            )}
          </div>
          <Button size="xs" variant="ghost"><Mail size={12} /></Button>
          <Button size="xs" variant="ghost" onClick={() => tripActions.notifyDriver(trip.id)}><Bell size={12} /></Button>
          <Button size="xs" variant="ghost"><Copy size={12} /></Button>
          <Button size="xs" variant="danger" onClick={() => tripActions.updateTripStatus(trip.id, 'cancelled')}><XCircle size={12} /></Button>
          <Button size="xs" variant="ghost" onClick={onClose}><X size={14} /></Button>
        </div>
      </div>

      <div style={{ padding: '6px 12px', display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {['direct', 'inbound', 'outbound'].map(t => (
          <Button key={t} size="xs" variant="ghost" onClick={() => setAddType(t)}><Plus size={12} /> {tripTypeLabel(t)}</Button>
        ))}
        <div style={{ flex: 1 }} />
        <Button size="xs" variant="ghost" onClick={() => setShowReorder(true)}><ArrowUpDown size={12} /> Reorder</Button>
        <Button size="xs" variant="ghost" onClick={() => tripActions.optimizeRoute(trip.id)}><Zap size={12} /> Optimize</Button>
      </div>

      <TripInfoSection trip={trip} f={f} estPay={estPay} s={s} />

      {allDone && trip.status === 'completed' && (
        <div className="trip-complete-banner">
          <Check size={14} /> {trip.trip_number} Completed — {uniqueLoads.length} invoice(s) | Pay: {formatCurrency(trip.driver_pay_amount)}
        </div>
      )}

      <div className="manifest-section">
        <div className="manifest-section-title">Loads ({uniqueLoads.length})</div>
        {uniqueLoads.map(load => (
          <ManifestLoadRow key={load.load_id} load={load} trip={trip}
            expanded={expandedLoad === load.load_id}
            onToggle={() => setExpandedLoad(expandedLoad === load.load_id ? null : load.load_id)}
            onLegAction={handleLegAction}
            onRemove={() => tripActions.removeLoad(trip.id, load.load_id)}
            onReverse={() => legActions.reverseAction(trip.id, load.load_id)}
            onPOD={(leg) => setPodLeg(leg)} />
        ))}
      </div>

      <div className="manifest-section">
        <div className="manifest-section-title">Activity</div>
        {(trip.activity || []).slice(0, 20).map((a, i) => (
          <div key={i} className="activity-item">
            <div className="activity-dot" />
            <div style={{ flex: 1 }}>{a.description}</div>
            <div className="activity-time">{formatDateTime(a.created_at)}</div>
          </div>
        ))}
        {!(trip.activity || []).length && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No activity yet</div>}
      </div>

      {addType && <LoadSelectionPopup tripType={addType} loads={addType === 'outbound' ? onDock : available}
        onAdd={ids => { tripActions.addLoads(trip.id, ids, addType); setAddType(null); }} onClose={() => setAddType(null)} />}
      {showReorder && <StopReorderPanel trip={trip} tripActions={tripActions} onClose={() => setShowReorder(false)} />}
      {podLeg && <PODUploadModal loadId={podLeg.load_id} onClose={handlePODComplete} />}
    </div>
  );
}

function TripInfoSection({ trip, f, estPay, s }) {
  return (
    <div className="manifest-section">
      <div className="manifest-section-title">Trip Details</div>
      <div className="manifest-info-grid">
        <div className="manifest-field"><label>Driver</label><span>{trip.driver_name || '\u2014'}</span></div>
        <div className="manifest-field"><label>Co-Driver</label><span>{trip.co_driver_name || '\u2014'}</span></div>
        <div className="manifest-field"><label>Truck</label><span>{trip.truck_number || '\u2014'}</span></div>
        <div className="manifest-field"><label>Trailer</label><span>{trip.trailer_number || '\u2014'}</span></div>
        <div className="manifest-field"><label>Date</label><span>{trip.planned_date?.slice(0, 10) || '\u2014'}</span></div>
        <div className="manifest-field"><label>Start</label><span>{formatTime(trip.start_time)}</span></div>
        <div className="manifest-field"><label>Miles</label>
          <input className="ct-input-inline" type="number" value={f('estimated_miles')} onChange={e => s('estimated_miles', e.target.value)} />
        </div>
        <div className="manifest-field"><label>Pay</label><span>{trip.driver_pay_type} @ {trip.driver_pay_rate} = <b>{formatCurrency(estPay)}</b></span></div>
      </div>
      {trip.carrier_name && <div className="manifest-field"><label>Carrier</label><span>{trip.carrier_name} — {formatCurrency(trip.carrier_rate)}</span></div>}
      <div className="manifest-field"><label>Revenue</label><span style={{ fontWeight: 700 }}>{formatCurrency(trip.total_revenue)}</span></div>
      <div className="manifest-field"><label>Margin</label>
        <span className={Number(trip.margin) >= 0 ? 'margin-pos' : 'margin-neg'}>{formatCurrency(trip.margin)}</span>
      </div>
      {trip.broadcast_notes && <div className="manifest-field"><label>Broadcast</label><span>{trip.broadcast_notes}</span></div>}
    </div>
  );
}
