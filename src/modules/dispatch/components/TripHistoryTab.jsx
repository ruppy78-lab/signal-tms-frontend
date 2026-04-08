import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Eye, Printer, Undo2, FileText, DollarSign } from 'lucide-react';
import { Badge, Spinner, Pagination, ContextMenu } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { tripTypeLabel } from '../../../shared/utils/helpers';
import { TRIP_TYPES } from '../../../shared/utils/constants';
import { calculateMargin, getStopTypeLabel, getStopTypeIcon } from '../utils/tripCalculations';
import dispatchApi from '../services/dispatchApi';
import toast from 'react-hot-toast';

export default function TripHistoryTab() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [loadCtx, setLoadCtx] = useState(null);
  const [filters, setFilters] = useState({ search: '', driver: '', type: '', date_from: '', date_to: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dispatchApi.getHistory({ ...filters, page, limit: 50 });
      setTrips(res.data || res.rows || []);
      setTotal(res.total || 0);
    } catch { setTrips([]); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const setFilter = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };
  const handleTripCtx = (e, trip) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, trip }); };
  const handleLoadCtx = (e, trip, load) => { e.preventDefault(); e.stopPropagation(); setLoadCtx({ x: e.clientX, y: e.clientY, trip, load }); };

  const handleReverse = async (tripId, loadId) => {
    try {
      await dispatchApi.reverseLoadAction(tripId, loadId);
      toast.success('Action reversed — board refreshed');
      fetch();
    } catch (err) { toast.error(err?.message || 'Please reverse later actions first'); }
  };

  const tripCtxItems = ctx ? [
    { label: 'View Details', icon: Eye, onClick: () => {} },
    { label: 'Print Trip Sheet', icon: Printer, onClick: () => window.print() },
    ...(ctx.trip.carrier_id ? [{ label: 'Rate Confirmation', icon: FileText, onClick: () => {} }] : []),
    { label: 'View Invoices', icon: FileText, onClick: () => {} },
    { label: 'View Settlement', icon: DollarSign, onClick: () => {} },
  ] : [];

  const loadCtxItems = loadCtx ? [
    { label: `Reverse Last Action`, icon: Undo2, onClick: () => handleReverse(loadCtx.trip.id, loadCtx.load.load_id) },
  ] : [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <div className="history-filters">
          <input className="ct-input" placeholder="Search trip#..." value={filters.search} onChange={e => setFilter('search', e.target.value)} />
          <input className="ct-input" placeholder="Driver..." value={filters.driver} onChange={e => setFilter('driver', e.target.value)} />
          <select className="ct-input" value={filters.type} onChange={e => setFilter('type', e.target.value)}>
            <option value="">All Types</option>
            {TRIP_TYPES.map(t => <option key={t} value={t}>{tripTypeLabel(t)}</option>)}
          </select>
          <input className="ct-input" type="date" value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)} />
          <input className="ct-input" type="date" value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div> : (
          <table className="dp-table" style={{ fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ width: 20 }}></th><th>Trip#</th><th>Type</th><th>Status</th>
                <th>Driver/Carrier</th><th>Truck</th><th>Date</th><th>Stops</th>
                <th>Miles</th><th>Revenue</th><th>Pay</th><th>Cost</th><th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => {
                const margin = calculateMargin(t.total_revenue, t.carrier_rate, t.driver_pay_amount);
                const loads = t.loads || [];
                return (
                  <React.Fragment key={t.id}>
                    <tr onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      onContextMenu={e => handleTripCtx(e, t)} style={{ cursor: 'pointer' }}>
                      <td>{expanded === t.id ? <ChevronDown size={11} /> : <ChevronRight size={11} />}</td>
                      <td style={{ fontWeight: 600 }}>{t.trip_number}</td>
                      <td><Badge status={t.trip_type} label={tripTypeLabel(t.trip_type)} /></td>
                      <td><Badge status={t.status} /></td>
                      <td>{t.driver_name || t.carrier_name || '\u2014'}</td>
                      <td>{t.truck_number || '\u2014'}</td>
                      <td>{formatDate(t.planned_date)}</td>
                      <td>{t.stop_count || loads.length}</td>
                      <td>{t.estimated_miles || t.actual_miles || '\u2014'}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(t.total_revenue)}</td>
                      <td>{formatCurrency(t.driver_pay_amount)}</td>
                      <td>{t.carrier_rate ? formatCurrency(t.carrier_rate) : '\u2014'}</td>
                      <td className={margin >= 0 ? 'margin-pos' : (margin < 0 ? 'margin-neg' : '')}>{formatCurrency(margin)}</td>
                    </tr>
                    {expanded === t.id && loads.map((l, i) => (
                      <tr key={l.id || i} style={{ background: 'var(--bg-secondary)' }}
                        onContextMenu={e => handleLoadCtx(e, t, l)}>
                        <td></td>
                        <td style={{ paddingLeft: 20 }}>{l.load_number}</td>
                        <td colSpan={2}>{l.customer_name}</td>
                        <td colSpan={2}>{l.origin_city} {'\u2192'} {l.dest_city}</td>
                        <td>{l.pieces}pcs</td>
                        <td>{l.weight ? Number(l.weight).toLocaleString() + 'lb' : ''}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(l.total_revenue)}</td>
                        <td colSpan={2}>
                          {getStopTypeIcon(l.stop_type)} {getStopTypeLabel(l.stop_type)}
                          {l.status === 'completed' && ' \u2713'}
                        </td>
                        <td><Badge status={l.status} /></td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              {!trips.length && <tr><td colSpan={13} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No history found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {total > 50 && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
          <Pagination page={page} total={total} perPage={50} onChange={setPage} />
        </div>
      )}

      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={tripCtxItems} onClose={() => setCtx(null)} />}
      {loadCtx && <ContextMenu x={loadCtx.x} y={loadCtx.y} items={loadCtxItems} onClose={() => setLoadCtx(null)} />}
    </div>
  );
}
