import React from 'react';
import { ChevronDown, ChevronRight, Check, MapPin, Zap, SkipForward, Undo2, Trash2, Upload } from 'lucide-react';
import { Button, Badge } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatters';
import { getStopTypeLabel, getStopTypeIcon } from '../utils/tripCalculations';

export default function ManifestLoadRow({ load, trip, expanded, onToggle, onLegAction, onRemove, onReverse, onPOD }) {
  const legs = (trip.legs || []).filter(l => l.load_id === load.load_id);
  const activeLeg = legs.find(l => l.status !== 'completed' && l.status !== 'skipped');
  const allDone = legs.every(l => l.status === 'completed' || l.status === 'skipped');

  return (
    <div className="manifest-load">
      <div className={`manifest-load-row ${allDone ? 'completed' : ''}`} onClick={onToggle}>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {allDone && <Check size={12} style={{ color: 'var(--success)' }} />}
        <span style={{ fontWeight: 600, minWidth: 60 }}>{load.load_number}</span>
        <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center', overflow: 'hidden' }}>
          {legs.map((leg, i) => (
            <React.Fragment key={leg.id || i}>
              {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{'\u2192'}</span>}
              <span className={`leg-chip ${leg.status} ${leg.id === activeLeg?.id && !allDone ? 'active-leg' : ''}`}>
                {leg.status === 'completed' && '\u2713 '}
                {leg.status === 'skipped' && '\u23E9 '}
                {getStopTypeIcon(leg.stop_type)} {getStopTypeLabel(leg.stop_type)}
              </span>
            </React.Fragment>
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600 }}>{formatCurrency(load.total_revenue)}</span>
      </div>
      {expanded && activeLeg && !allDone && (
        <LegActions leg={activeLeg} onAction={onLegAction} onRemove={onRemove} onReverse={onReverse} onPOD={onPOD} />
      )}
    </div>
  );
}

function LegActions({ leg, onAction, onRemove, onReverse, onPOD }) {
  const t = leg.stop_type;
  const s = leg.status;
  return (
    <div className="manifest-leg-actions">
      {t === 'pickup' && s === 'pending' && (
        <Button size="xs" onClick={() => onAction(leg.id, 'arrived')}><MapPin size={11} /> Mark Arrived</Button>
      )}
      {t === 'pickup' && s === 'arrived' && (
        <Button size="xs" variant="success" onClick={() => onAction(leg.id, 'completed')}><Check size={11} /> Picked Up</Button>
      )}
      {t === 'pickup' && s === 'pending' && (
        <Button size="xs" variant="success" onClick={() => onAction(leg.id, 'completed')}><Check size={11} /> Picked Up</Button>
      )}

      {t === 'delivery' && s === 'pending' && (
        <Button size="xs" onClick={() => onAction(leg.id, 'arrived')}><MapPin size={11} /> Mark Arrived</Button>
      )}
      {t === 'delivery' && s === 'arrived' && (
        <Button size="xs" variant="success" onClick={() => onPOD(leg)}><Upload size={11} /> Delivered + POD</Button>
      )}
      {t === 'delivery' && s === 'pending' && (
        <Button size="xs" variant="success" onClick={() => onPOD(leg)}><Upload size={11} /> Delivered + POD</Button>
      )}
      {t === 'delivery' && (
        <Button size="xs" variant="ghost" onClick={() => onAction(leg.id, 'force_complete')}><Zap size={11} /> Force Deliver</Button>
      )}

      {t === 'drop_warehouse' && (
        <Button size="xs" variant="success" onClick={() => onAction(leg.id, 'completed')}><Check size={11} /> Dropped on Dock</Button>
      )}

      {t === 'pickup_warehouse' && (
        <Button size="xs" variant="success" onClick={() => onAction(leg.id, 'completed')}><Check size={11} /> Picked from Dock</Button>
      )}

      <Button size="xs" variant="ghost" onClick={() => onAction(leg.id, 'skipped')}><SkipForward size={11} /> Skip</Button>
      <Button size="xs" variant="ghost" onClick={onReverse}><Undo2 size={11} /> Undo</Button>
      <Button size="xs" variant="danger" onClick={onRemove}><Trash2 size={11} /> Remove</Button>
    </div>
  );
}
