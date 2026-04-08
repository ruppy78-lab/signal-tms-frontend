import React from 'react';
import { Warehouse } from 'lucide-react';
import DispatchLoadContextMenu, { useLoadContextMenu } from './DispatchLoadContextMenu';

const fmtDate = (d) => { if (!d) return '—'; const s = d.slice(5, 10); return s.replace('-', '-'); };

export default function OnDockPanel({ loads = [], onRefresh, selectedTrip, tripActions, loadActions, selectedIds = [], onToggleSelect, onStatusChange, onClickLoad }) {
  const { ctx, open, close } = useLoadContextMenu();

  return (
    <div className="dp-panel ondock" onContextMenu={e => e.preventDefault()}>
      <div className="dp-panel-header">
        <Warehouse size={14} />
        ON DOCK
        <span className="dp-count">{loads.length}</span>
      </div>
      <div className="dp-panel-body">
        <div style={{ display:'grid',gridTemplateColumns:'62px 110px 1fr 1fr 46px 46px 30px 58px 60px',gap:4,padding:'6px 8px',marginBottom:4,fontSize:9,fontWeight:600,color:'#fff',textTransform:'uppercase',background:'#003865',borderRadius:'3px 3px 0 0' }}>
          <span>Load #</span><span>Customer</span><span>Origin</span><span>Destination</span><span>PU</span><span>Del</span><span>Pcs</span><span>Wgt</span><span></span>
        </div>
        {loads.map((l) => {
          const origin = l.origin_city || '';
          const originSt = l.origin_state || l.origin_province || '';
          const dest = l.dest_city || '';
          const destSt = l.dest_state || l.dest_province || '';
          const pieces = Number(l.pieces) || Number(l.total_pieces) || 0;
          const weight = Number(l.weight) || Number(l.total_weight) || 0;
          const hasTrip = !!l.trip_id;
          const hasAppt = !!l.requires_appointment;
          return (
            <div key={l.id}
              className={`dispatch-load-card ${selectedIds.includes(l.id) ? 'selected' : ''}`}
              style={{ display:'grid',gridTemplateColumns:'62px 110px 1fr 1fr 46px 46px 30px 58px 60px',gap:4,padding:'4px 8px',marginBottom:1,background:'#fff',border:'1px solid #e0e0e0',borderRadius:3,cursor:'pointer',fontSize:11,alignItems:'center',whiteSpace:'nowrap',overflow:'hidden' }}
              onContextMenu={(e) => open(e, l)}
              onClick={() => onClickLoad?.(l)}>
              <span style={{ fontWeight:700,color:'#003865' }}>{l.load_number}</span>
              <span style={{ color:'#555',overflow:'hidden',textOverflow:'ellipsis' }}>{l.customer_name||''}</span>
              <span style={{ color:'#888',overflow:'hidden',textOverflow:'ellipsis' }}>{origin}{originSt ? ', '+originSt : ''}</span>
              <span style={{ color:'#888',overflow:'hidden',textOverflow:'ellipsis' }}>{dest}{destSt ? ', '+destSt : ''}</span>
              <span style={{ color:'#666' }}>{fmtDate(l.pickup_date)}</span>
              <span style={{ color:'#666' }}>{fmtDate(l.delivery_date)}</span>
              <span style={{ color:'#666' }}>{pieces > 0 ? pieces : '—'}</span>
              <span style={{ color:'#666' }}>{weight > 0 ? weight.toLocaleString()+' lb' : '—'}</span>
              <span style={{ display:'flex',gap:3,alignItems:'center',fontSize:10 }}>
                {hasTrip && <span style={{ color:'#0063A3' }} title="Assigned to trip">●LG</span>}
                {hasAppt && <span title="Appointment">📅</span>}
              </span>
            </div>
          );
        })}
        {loads.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>No loads on dock</div>}
      </div>
      {loadActions && <DispatchLoadContextMenu ctx={ctx} onClose={close} loadActions={loadActions} />}
    </div>
  );
}
