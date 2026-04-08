import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Spinner, Pagination, EmptyState } from '../../shared/components';
import { SETTLEMENT_STATUSES } from '../../shared/utils/constants';
import useSettlements from './hooks/useSettlements';
import SettlementList from './components/SettlementList';
import SettlementDetail from './components/SettlementDetail';

const TABS = ['all', ...SETTLEMENT_STATUSES];

export default function SettlementsModule() {
  const { settlements, loading, total, params, setParams, approveSettlement, paySettlement, updateSettlement } = useSettlements();
  const [selected, setSelected] = useState(null);
  const pages = Math.ceil(total / (params.limit || 50));

  const setTab = (t) => setParams(p => ({ ...p, status: t === 'all' ? '' : t, page: 1 }));
  const activeTab = params.status || 'all';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Settlements</div>
          <div className="page-subtitle">{total} settlements</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ padding: '0' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflow: 'auto' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '8px 16px', fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === t ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === t ? 600 : 400, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ padding: '8px 12px', display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: '0 0 240px' }}>
              <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
              <input className="form-input" placeholder="Search settlements..." value={params.search || ''}
                onChange={e => setParams(p => ({ ...p, search: e.target.value, page: 1 }))}
                style={{ paddingLeft: 28, height: 32, fontSize: 12 }} />
            </div>
            <input className="form-input" placeholder="Driver filter..." value={params.driver || ''}
              onChange={e => setParams(p => ({ ...p, driver: e.target.value, page: 1 }))}
              style={{ height: 32, fontSize: 12, width: 180 }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            : settlements.length === 0 ? <EmptyState title="No settlements found" />
            : <SettlementList settlements={settlements} onSelect={setSelected} />}
        </div>
      </div>

      <Pagination page={params.page || 1} pages={pages} total={total}
        onPrev={() => setParams(p => ({ ...p, page: p.page - 1 }))}
        onNext={() => setParams(p => ({ ...p, page: p.page + 1 }))}
        onGoTo={(n) => setParams(p => ({ ...p, page: n }))} />

      <SettlementDetail open={!!selected} onClose={() => setSelected(null)} settlement={selected}
        onApprove={approveSettlement} onPay={paySettlement} onUpdate={updateSettlement} />
    </div>
  );
}
