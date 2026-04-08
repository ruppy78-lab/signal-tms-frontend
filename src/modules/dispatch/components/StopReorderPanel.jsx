import React, { useState, useCallback } from 'react';
import { GripVertical, Zap, Save, X, MapPin } from 'lucide-react';
import { Modal, Button, Badge } from '../../../shared/components';
import { getStopTypeLabel } from '../utils/tripCalculations';

export default function StopReorderPanel({ trip, tripActions, onClose }) {
  const stops = trip.legs || trip.loads || [];
  const [order, setOrder] = useState(stops.map((s) => s.id));
  const [dragIdx, setDragIdx] = useState(null);

  const handleDragStart = (idx) => setDragIdx(idx);

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    setOrder(newOrder);
    setDragIdx(idx);
  };

  const handleDragEnd = () => setDragIdx(null);

  const handleSave = async () => {
    await tripActions.reorderStops(trip.id, order);
    onClose();
  };

  const handleOptimize = async () => {
    await tripActions.optimizeRoute(trip.id);
    onClose();
  };

  const orderedStops = order.map((id) => stops.find((s) => s.id === id)).filter(Boolean);

  return (
    <Modal open onClose={onClose} title="Reorder Stops" size="sm" footer={
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <Button variant="ghost" onClick={handleOptimize}>
          <Zap size={14} /> Auto Optimize
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}><X size={14} /> Cancel</Button>
          <Button onClick={handleSave}><Save size={14} /> Save Order</Button>
        </div>
      </div>
    }>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
        Drag stops to reorder the route
      </div>
      {orderedStops.map((stop, idx) => (
        <div
          key={stop.id}
          className="reorder-item"
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={handleDragEnd}
          style={{
            opacity: dragIdx === idx ? 0.5 : 1,
            background: dragIdx === idx ? 'var(--bg-secondary)' : undefined,
          }}
        >
          <GripVertical size={14} className="reorder-handle" />
          <span style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
            flexShrink: 0,
          }}>
            {idx + 1}
          </span>
          <MapPin size={12} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>
              {stop.location_name || stop.load_number || `Stop ${idx + 1}`}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {getStopTypeLabel(stop.stop_type)} &middot; {stop.location_city || ''}
            </div>
          </div>
          <Badge status={stop.status || 'pending'} />
        </div>
      ))}
    </Modal>
  );
}
