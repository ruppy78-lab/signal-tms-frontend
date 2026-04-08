import React from 'react';
import { Truck, Check } from 'lucide-react';
import DispatchLoadContextMenu, { useLoadContextMenu } from './DispatchLoadContextMenu';

export default function EnroutePanel({ loads = [], onSelectTrip, loadActions, onStatusChange, onClickLoad }) {
  const { ctx, open, close } = useLoadContextMenu();

  return (
    <div className="dp-panel enroute" onContextMenu={e => e.preventDefault()}>
      <div className="dp-panel-header">
        <Truck size={14} />
        EN ROUTE
        <span className="dp-count">{loads.length}</span>
      </div>
      <div className="dp-panel-body">
        {loads.map((l) => {
          const pieces = Number(l.total_pieces) || 0;
          const weight = Number(l.total_weight) || 0;
          const showFreight = pieces > 0 || weight > 0;
          const origin = l.origin_city || (Array.isArray(l.stops) && l.stops[0]?.city) || '';
          const dest = l.dest_city || (Array.isArray(l.stops) && l.stops[l.stops.length - 1]?.city) || '';
          return (
            <div key={l.id}
              className="dispatch-load-card"
              style={{ padding:'6px 8px',marginBottom:3,background:'#fff',border:'1px solid #e0e0e0',borderRadius:4,cursor:'pointer',fontSize:11 }}
              onContextMenu={(e) => open(e, l)}
              onClick={() => onClickLoad?.(l)}>
              <div style={{ display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',overflow:'hidden' }}>
                <span style={{ fontWeight:700,color:'#003865' }}>{l.load_number}</span>
                <span style={{ color:'#555' }}>{l.customer_name||''}</span>
                {(origin||dest)&&<span style={{ color:'#888' }}>{origin}→{dest}</span>}
              </div>
              {showFreight && (
                <div style={{ fontSize:10,color:'#666',marginTop:2 }}>
                  {pieces > 0 ? `${pieces} pallets` : ''}{pieces > 0 && weight > 0 ? '  |  ' : ''}{weight > 0 ? `${weight.toLocaleString()}lb` : ''}
                </div>
              )}
              <div style={{ marginTop:3 }}>
                <button
                  style={{ width:'100%',height:28,fontSize:11,fontWeight:600,background:'#00796B',color:'#fff',border:'none',borderRadius:3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}
                  onClick={(e) => { e.stopPropagation(); onStatusChange?.(l.id, 'delivered'); }}>
                  Delivered <Check size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {loads.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>No loads en route</div>}
      </div>
      {loadActions && <DispatchLoadContextMenu ctx={ctx} onClose={close} loadActions={loadActions} />}
    </div>
  );
}
