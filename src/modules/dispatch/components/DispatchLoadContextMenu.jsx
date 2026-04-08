import React, { useState, useEffect, useRef } from 'react';
import { Eye, Edit, Plus, Copy, RotateCcw, XCircle, Printer, Check, Minus } from 'lucide-react';

export function useLoadContextMenu() {
  const [ctx, setCtx] = useState(null);
  const open = (e, load) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, load }); };
  const close = () => setCtx(null);
  return { ctx, open, close };
}

export default function DispatchLoadContextMenu({ ctx, onClose, loadActions }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ctx) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ctx, onClose]);

  if (!ctx) return null;
  const load = ctx.load;

  // Keep menu within viewport
  const menuW = 210, menuH = 200;
  const x = ctx.x + menuW > window.innerWidth ? ctx.x - menuW : ctx.x;
  const y = ctx.y + menuH > window.innerHeight ? ctx.y - menuH : ctx.y;

  const reverseMap = { on_dock: 'available', en_route: 'on_dock', delivered: 'on_dock' };
  const reverseTarget = reverseMap[load.status];

  const statusItems = [];
  if (load.status === 'available') statusItems.push({ icon: Check, label: 'Mark Pickup Done', onClick: () => { loadActions.onStatusChange?.(load.id, 'on_dock'); onClose(); } });
  if (load.status === 'on_dock') statusItems.push({ icon: Check, label: 'Mark Dispatched', onClick: () => { loadActions.onStatusChange?.(load.id, 'en_route'); onClose(); } });
  if (load.status === 'en_route') statusItems.push({ icon: Check, label: 'Mark Delivered', onClick: () => { loadActions.onStatusChange?.(load.id, 'delivered'); onClose(); } });
  if (reverseTarget) statusItems.push({ icon: RotateCcw, label: 'Reverse Status', onClick: () => { loadActions.onStatusChange?.(load.id, reverseTarget); onClose(); } });

  const items = [
    { icon: Eye, label: 'View Load Details', onClick: () => { loadActions.onViewLoad(load); onClose(); } },
    { icon: Edit, label: 'Edit Load', onClick: () => { loadActions.onEditLoad(load); onClose(); } },
    { icon: Printer, label: 'Print Load Sheet', onClick: () => { window.print(); onClose(); } },
    { divider: true },
    ...statusItems,
    { divider: true },
    { icon: Plus, label: 'Add to Trip', onClick: () => { loadActions.onCreateTrip('direct', [load.id]); onClose(); } },
    ...(load.trip_id ? [{ icon: Minus, label: 'Remove from Trip', onClick: () => { loadActions.onRemoveFromTrip?.(load); onClose(); } }] : []),
    { icon: Copy, label: 'Copy Load #', onClick: () => { loadActions.onCopyLoadNum(load); onClose(); } },
    { divider: true },
    { icon: XCircle, label: 'Cancel Load', danger: true, onClick: () => { loadActions.onStatusChange?.(load.id, 'cancelled'); onClose(); } },
  ];

  return (
    <div ref={ref} style={{
      position: 'fixed', left: x, top: y, zIndex: 2000,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
      minWidth: menuW, overflow: 'hidden',
    }}>
      <div style={{
        padding: '6px 12px', background: 'var(--modal-header)', color: '#fff',
        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      }}>
        <div>{load.load_number} — {load.customer_name || ''}</div>
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
          {load.origin_city || ''}{load.dest_city ? ' → ' + load.dest_city : ''}
          {(Number(load.pieces) > 0 || Number(load.weight) > 0) && ' | '}
          {Number(load.pieces) > 0 && (load.pieces + ' plt')}
          {Number(load.pieces) > 0 && Number(load.weight) > 0 && ' | '}
          {Number(load.weight) > 0 && (Number(load.weight).toLocaleString() + 'lb')}
        </div>
      </div>
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
        ) : (
          <button key={i} onClick={item.onClick} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '7px 12px', border: 'none', background: 'none',
            cursor: 'pointer', fontSize: 11, color: 'var(--text-primary)',
            fontFamily: 'var(--font-family)', textAlign: 'left',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <item.icon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
