import React, { useState } from 'react';
import { Button, Modal, Spinner, EmptyState, Pagination } from '../../../shared/components';
import { FormGrid, FormSection } from '../../../shared/components/Form';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { statusColor } from '../../../shared/utils/helpers';
import { EXPENSE_CATEGORIES } from '../../../shared/utils/constants';
import { Plus, Search } from 'lucide-react';
import { useExpenses } from '../hooks/useAccounting';

const emptyForm = { category: 'Fuel', description: '', amount: '', expense_date: '', notes: '' };

export default function ExpenseList() {
  const { expenses, loading, total, params, setParams, createExpense } = useExpenses();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const pages = Math.ceil(total / (params.limit || 50));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.description || !form.amount) return;
    createExpense({ ...form, amount: Number(form.amount) });
    setFormOpen(false);
    setForm(emptyForm);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '0 0 220px' }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search expenses..." value={params.search || ''}
            onChange={e => setParams(p => ({ ...p, search: e.target.value, page: 1 }))}
            style={{ paddingLeft: 28, height: 32, fontSize: 12 }} />
        </div>
        <select className="form-input" value={params.category || ''} onChange={e => setParams(p => ({ ...p, category: e.target.value, page: 1 }))}
          style={{ height: 32, fontSize: 12, width: 140 }}>
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="form-input" type="date" value={params.dateFrom || ''}
          onChange={e => setParams(p => ({ ...p, dateFrom: e.target.value, page: 1 }))}
          style={{ height: 32, fontSize: 12, width: 140 }} />
        <input className="form-input" type="date" value={params.dateTo || ''}
          onChange={e => setParams(p => ({ ...p, dateTo: e.target.value, page: 1 }))}
          style={{ height: 32, fontSize: 12, width: 140 }} />
        <div style={{ flex: 1 }} />
        <Button icon={Plus} size="sm" onClick={() => { setForm(emptyForm); setFormOpen(true); }}>Add Expense</Button>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
        : expenses.length === 0 ? <EmptyState title="No expenses found" />
        : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table className="tms-table">
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Trip #</th><th>Driver</th><th style={{ textAlign: 'right' }}>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={i}>
                    <td>{formatDate(e.expense_date)}</td>
                    <td><span className="badge badge-active">{e.category}</span></td>
                    <td>{e.description}</td>
                    <td>{e.trip_number || '---'}</td>
                    <td>{e.driver_name || '---'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(e.amount)}</td>
                    <td><span className={`badge ${statusColor(e.status || 'active')}`}>{e.status || 'recorded'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={params.page || 1} pages={pages} total={total}
        onPrev={() => setParams(p => ({ ...p, page: p.page - 1 }))}
        onNext={() => setParams(p => ({ ...p, page: p.page + 1 }))}
        onGoTo={(n) => setParams(p => ({ ...p, page: n }))} />

      {formOpen && (
        <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add Expense" width={480}>
          <FormGrid cols={2}>
            <div><label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="form-label">Amount ($)</label>
              <input className="form-input" type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} /></div>
            <div><label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Expense</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
