import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, onPrev, onNext, onGoTo }) {
  if (pages <= 1) return null;
  const range = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  for (let i = start; i <= end; i++) range.push(i);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 0', fontSize: 11, color: 'var(--text-secondary)' }}>
      <button className="btn btn-xs btn-secondary" onClick={onPrev} disabled={page <= 1}><ChevronLeft size={12} /></button>
      {range.map(n => (
        <button key={n} className={`btn btn-xs ${n === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onGoTo(n)}>{n}</button>
      ))}
      <button className="btn btn-xs btn-secondary" onClick={onNext} disabled={page >= pages}><ChevronRight size={12} /></button>
      <span style={{ marginLeft: 8 }}>{total} total</span>
    </div>
  );
}
