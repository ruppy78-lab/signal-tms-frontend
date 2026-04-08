import React from 'react';

const STATUS_COLORS = {
  available:'#0063A3', on_dock:'#92400E', en_route:'#2E7D32',
  dispatched:'#1E40AF', in_transit:'#2E7D32', delivered:'#00796B',
  at_pickup:'#92400E', at_delivery:'#2E7D32',
};

export default function LoadList({ loads, onSelect, driver, onLogout }) {
  return (
    <div style={{ minHeight:'100vh',background:'#F0F4F8' }}>
      {/* Header */}
      <div style={{ background:'#003865',color:'#fff',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ fontWeight:700,fontSize:15 }}>🚛 Signal TMS</div>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <span style={{ fontSize:13 }}>👤 {driver?.first_name}</span>
          <button onClick={onLogout} style={{ background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'4px 10px',borderRadius:4,fontSize:11,cursor:'pointer' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ padding:16 }}>
        <div style={{ fontSize:14,fontWeight:700,color:'#003865',marginBottom:12 }}>Active Loads ({loads.length})</div>

        {loads.length === 0 && (
          <div style={{ textAlign:'center',padding:40,color:'#888',fontSize:14 }}>
            No active loads assigned.<br/>Contact dispatcher.
          </div>
        )}

        {loads.map(l => (
          <div key={l.id} onClick={() => onSelect(l)} style={{
            background:'#fff',borderRadius:8,padding:14,marginBottom:10,
            border:'1px solid #e0e0e0',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',cursor:'pointer',
          }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
              <span style={{ fontWeight:700,fontSize:15,color:'#003865' }}>{l.load_number}</span>
              {l.is_cross_border && <span>🌎 PAPS</span>}
            </div>
            <div style={{ fontSize:13,color:'#333',marginBottom:4 }}>
              {l.origin_name||l.origin_city||'Pickup'} → {l.dest_name||l.dest_city||'Delivery'}
            </div>
            <div style={{ fontSize:12,color:'#666',marginBottom:6 }}>
              {l.total_pallets ? l.total_pallets+' pallets' : ''}{l.total_pallets && l.total_weight ? ' | ' : ''}{l.total_weight ? Number(l.total_weight).toLocaleString()+'lb' : ''}
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontSize:11,color:'#888' }}>
                {l.pickup_date ? 'Pickup: '+new Date(l.pickup_date).toLocaleDateString('en-CA',{month:'short',day:'numeric'}) : ''}
                {l.delivery_date ? ' | Delivery: '+new Date(l.delivery_date).toLocaleDateString('en-CA',{month:'short',day:'numeric'}) : ''}
              </span>
              <span style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,color:'#fff',
                background: STATUS_COLORS[l.status]||'#888' }}>
                {(l.status||'').replace(/_/g,' ').toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
