import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Trash2, Edit, X, Download, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { ContextMenu, useContextMenu, Pagination, Spinner, Field, Confirm } from '../../components/common';

const CATS = ['Fuel','Repairs & Maintenance','Lumper / Labour','Driver Pay','Insurance',
  'Permits & Licenses','Office & Admin','Equipment','Tolls & Scales','Meals & Accommodation',
  'Trailer Rental','Subcontractor','Other'];

const CAT_ICON = { 'Fuel':'⛽','Repairs & Maintenance':'🔧','Lumper / Labour':'👷',
  'Driver Pay':'💰','Insurance':'🛡️','Permits & Licenses':'📋','Office & Admin':'🏢',
  'Equipment':'🔩','Tolls & Scales':'🛣️','Meals & Accommodation':'🍽️',
  'Trailer Rental':'🚛','Subcontractor':'🤝','Other':'📦' };

const CAT_COLOR = { 'Fuel':'#e65100','Repairs & Maintenance':'#1565c0','Lumper / Labour':'#6a1b9a',
  'Driver Pay':'#2e7d32','Insurance':'#0063A3','Permits & Licenses':'#558b2f',
  'Office & Admin':'#37474f','Equipment':'#4527a0','Tolls & Scales':'#00695c',
  'Meals & Accommodation':'#e91e63','Trailer Rental':'#f57f17','Subcontractor':'#bf360c','Other':'#78909c' };

const fmt = d => d ? new Date(d).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}) : '—';
const TH = {fontSize:11,fontWeight:700,padding:'7px 10px',background:'#003865',color:'#fff',textAlign:'left',whiteSpace:'nowrap'};
const TD = {fontSize:12,padding:'7px 10px',borderBottom:'1px solid #f0f0f0',verticalAlign:'middle'};

const EMPTY = { category:'Fuel', amount:'', vendor:'', description:'',
  expense_date: new Date().toISOString().slice(0,10),
  load_id:'', driver_id:'', payment_method:'Company Card', notes:'' };

// ─── Expense Form Modal ───────────────────────────────────────────────────────
function ExpenseModal({ open, editing, onClose, loads, drivers }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(editing || EMPTY);
  React.useEffect(() => { setForm(editing ? {...EMPTY,...editing, expense_date:editing.expense_date?.slice(0,10)||EMPTY.expense_date} : EMPTY); }, [editing, open]);
  const h = e => setForm(f => ({...f, [e.target.name]: e.target.value}));

  const mut = useMutation({
    mutationFn: b => editing ? api.put(`/expenses/${editing.id}`, b) : api.post('/expenses', b),
    onSuccess: r => {
      toast.success(editing ? 'Expense updated' : `${r.data.data?.expense_number} created`);
      qc.invalidateQueries(['expenses']); onClose();
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:10,width:540,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
        <div style={{padding:'14px 18px',background:'#003865',color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <span style={{fontWeight:700,fontSize:15}}>{editing ? 'Edit Expense' : '+ New Expense'}</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:18}}>×</button>
        </div>
        <div style={{padding:20,overflowY:'auto',flex:1}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <Field label="Category" required>
              <select name="category" className="form-input" value={form.category} onChange={h}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Amount ($)" required>
              <input type="number" step="0.01" name="amount" className="form-input"
                value={form.amount} onChange={h} placeholder="0.00"/>
            </Field>
            <Field label="Date">
              <input type="date" name="expense_date" className="form-input" value={form.expense_date} onChange={h}/>
            </Field>
            <Field label="Payment Method">
              <select name="payment_method" className="form-input" value={form.payment_method} onChange={h}>
                {['Company Card','Cash','Bank Transfer','Cheque','Personal (Reimbursable)'].map(m=><option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Vendor / Supplier">
              <input name="vendor" className="form-input" value={form.vendor||''} onChange={h} placeholder="e.g. Petro Canada"/>
            </Field>
            <Field label="Link to Load (optional)">
              <select name="load_id" className="form-input" value={form.load_id||''} onChange={h}>
                <option value="">No load</option>
                {(loads||[]).map(l=><option key={l.id} value={l.id}>{l.load_number} — {l.customer_name}</option>)}
              </select>
            </Field>
            <Field label="Driver (optional)">
              <select name="driver_id" className="form-input" value={form.driver_id||''} onChange={h}>
                <option value="">No driver</option>
                {(drivers||[]).map(d=><option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
              </select>
            </Field>
            <Field label="Description">
              <input name="description" className="form-input" value={form.description||''} onChange={h} placeholder="Brief description…"/>
            </Field>
          </div>
          <Field label="Notes">
            <textarea name="notes" className="form-input" rows={2} value={form.notes||''} onChange={h}/>
          </Field>
        </div>
        <div style={{padding:'12px 18px',borderTop:'1px solid #eee',display:'flex',gap:8,justifyContent:'flex-end',flexShrink:0}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>mut.mutate(form)} disabled={mut.isPending||!form.amount||!form.category}>
            {mut.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── P&L Report ───────────────────────────────────────────────────────────────
function PnLReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pnl', month, year],
    queryFn: () => api.get('/expenses/report/pnl', { params:{month,year} }).then(r => r.data.data),
  });

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Signal TMS — Profit & Loss Report'],
      [`Period: ${data.period.label}`],
      [''],
      ['REVENUE',''],
      ['Gross Revenue', `$${data.revenue.gross.toFixed(2)}`],
      ['Collected',     `$${data.revenue.collected.toFixed(2)}`],
      ['Outstanding',   `$${data.revenue.outstanding.toFixed(2)}`],
      [''],
      ['EXPENSES',''],
      ...data.expenses.by_category.map(e => [e.category, `$${e.total.toFixed(2)}`]),
      ['Total Expenses', `$${data.expenses.total.toFixed(2)}`],
      [''],
      ['NET PROFIT', `$${data.net_profit.toFixed(2)}`],
      ['MARGIN', `${data.margin}%`],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `PnL-${year}-${String(month).padStart(2,'0')}.csv`;
    a.click();
  };

  const profit = data?.net_profit || 0;
  const isProfit = profit >= 0;

  return (
    <div>
      {/* Period selector */}
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
        <select className="form-input" style={{width:140}} value={month} onChange={e=>setMonth(+e.target.value)}>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=>(
            <option key={i+1} value={i+1}>{m}</option>
          ))}
        </select>
        <select className="form-input" style={{width:90}} value={year} onChange={e=>setYear(+e.target.value)}>
          {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={refetch}><RefreshCw size={13}/></button>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4}}>
          <Download size={13}/> Export CSV
        </button>
      </div>

      {isLoading ? <div style={{textAlign:'center',padding:40}}><Spinner/></div> : data && (
        <div>
          {/* Summary cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            {[
              {label:'Gross Revenue', value:`$${data.revenue.gross.toFixed(2)}`, color:'#2E7D32', bg:'#E8F5E9', icon:'💰'},
              {label:'Total Expenses',value:`$${data.expenses.total.toFixed(2)}`, color:'#B71C1C', bg:'#FFEBEE', icon:'💸'},
              {label:'Net Profit',    value:`$${Math.abs(profit).toFixed(2)}`, color:isProfit?'#2E7D32':'#B71C1C', bg:isProfit?'#E8F5E9':'#FFEBEE', icon:isProfit?'📈':'📉', prefix:profit<0?'-':''},
              {label:'Margin',        value:`${data.margin}%`, color:parseFloat(data.margin)>0?'#2E7D32':'#B71C1C', bg:parseFloat(data.margin)>0?'#E8F5E9':'#FFEBEE', icon:'%'},
            ].map(c=>(
              <div key={c.label} style={{background:c.bg,border:`1px solid ${c.color}22`,borderRadius:8,padding:'14px',borderLeft:`4px solid ${c.color}`}}>
                <div style={{fontSize:11,color:c.color,fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{c.label}</div>
                <div style={{fontSize:20,fontWeight:800,color:c.color}}>{c.prefix||''}{c.value}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Revenue breakdown */}
            <div style={{border:'1px solid #e0e0e0',borderRadius:8,overflow:'hidden'}}>
              <div style={{padding:'10px 14px',background:'#003865',color:'#fff',fontWeight:700,fontSize:13}}>💰 Revenue</div>
              <div style={{padding:14}}>
                {[
                  ['Gross Revenue', data.revenue.gross, '#2E7D32'],
                  ['Collected',     data.revenue.collected, '#0063A3'],
                  ['Outstanding',   data.revenue.outstanding, '#E65100'],
                ].map(([l,v,c])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f5f5f5'}}>
                    <span style={{fontSize:13,color:'#555'}}>{l}</span>
                    <span style={{fontSize:13,fontWeight:700,color:c}}>${v.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{marginTop:8,fontSize:12,color:'#888'}}>{data.revenue.invoice_count} invoice{data.revenue.invoice_count!==1?'s':''}</div>
              </div>
            </div>

            {/* Expense breakdown */}
            <div style={{border:'1px solid #e0e0e0',borderRadius:8,overflow:'hidden'}}>
              <div style={{padding:'10px 14px',background:'#003865',color:'#fff',fontWeight:700,fontSize:13}}>💸 Expenses by Category</div>
              <div style={{padding:14,maxHeight:280,overflowY:'auto'}}>
                {data.expenses.by_category.length === 0 ? (
                  <div style={{textAlign:'center',padding:20,color:'#aaa',fontSize:13}}>No expenses this month</div>
                ) : data.expenses.by_category.map(e=>(
                  <div key={e.category} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,color:'#333'}}>{CAT_ICON[e.category]||'📦'} {e.category}</span>
                      <span style={{fontSize:12,fontWeight:700,color:CAT_COLOR[e.category]||'#555'}}>${e.total.toFixed(2)}</span>
                    </div>
                    <div style={{height:4,background:'#f0f0f0',borderRadius:2,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${Math.min(100,e.pct)}%`,background:CAT_COLOR[e.category]||'#003865',borderRadius:2,transition:'width 0.5s'}}/>
                    </div>
                    <div style={{fontSize:10,color:'#aaa',marginTop:1}}>{e.pct}% of revenue · {e.count} expense{e.count!==1?'s':''}</div>
                  </div>
                ))}
                <div style={{borderTop:'2px solid #003865',paddingTop:8,marginTop:4,display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,fontWeight:700}}>Total</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#B71C1C'}}>${data.expenses.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Load stats */}
          <div style={{marginTop:16,background:'#f8f9fa',borderRadius:8,padding:'12px 16px',display:'flex',gap:24}}>
            <div><span style={{fontSize:11,color:'#888'}}>Total Loads</span><div style={{fontSize:16,fontWeight:700,color:'#003865'}}>{data.loads.total_loads}</div></div>
            <div><span style={{fontSize:11,color:'#888'}}>Delivered</span><div style={{fontSize:16,fontWeight:700,color:'#2E7D32'}}>{data.loads.delivered}</div></div>
            <div><span style={{fontSize:11,color:'#888'}}>Delivered Revenue</span><div style={{fontSize:16,fontWeight:700,color:'#2E7D32'}}>${parseFloat(data.loads.delivered_revenue||0).toFixed(2)}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Expenses Page ───────────────────────────────────────────────────────
export default function Expenses() {
  const qc = useQueryClient();
  const [tab,setTab]         = useState('expenses'); // expenses | pnl
  const [page,setPage]       = useState(1);
  const [search,setSearch]   = useState('');
  const [category,setCategory] = useState('');
  const [modal,setModal]     = useState(false);
  const [editing,setEditing] = useState(null);
  const [confirmDel,setConfirmDel] = useState(null);
  const { menu, openMenu, closeMenu } = useContextMenu();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses',page,search,category],
    queryFn: () => api.get('/expenses',{params:{page,limit:50,search,category}}).then(r=>r.data),
    keepPreviousData: true,
  });
  const { data: loads }   = useQuery({ queryKey:['loads-dd'],   queryFn:()=>api.get('/loads',{params:{limit:200}}).then(r=>r.data.data) });
  const { data: drivers } = useQuery({ queryKey:['drivers-dd'], queryFn:()=>api.get('/drivers',{params:{limit:100}}).then(r=>r.data.data) });

  const delMut = useMutation({
    mutationFn: id => api.delete(`/expenses/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['expenses']); setConfirmDel(null); },
    onError: e => toast.error(e.response?.data?.message||'Failed'),
  });

  const rows   = data?.data || [];
  const paging = data?.pagination;
  const totals = data?.totals;

  const rowCtx = (e, exp) => openMenu(e, [
    { label:'Edit',   icon:Edit,   action:()=>{ setEditing(exp); setModal(true); } },
    { divider:true },
    { label:'Delete', icon:Trash2, danger:true, action:()=>setConfirmDel(exp) },
  ]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 90px)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
        <h1 className="page-title">Accounting</h1>
        <div style={{display:'flex',background:'#f0f0f0',borderRadius:6,padding:3,gap:2,marginRight:'auto'}}>
          {[['expenses','💸 Expenses'],['pnl','📊 P&L Report']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{padding:'5px 14px',border:'none',borderRadius:4,fontSize:12,fontWeight:tab===id?700:400,
                background:tab===id?'#fff':'transparent',color:tab===id?'#003865':'#888',cursor:'pointer',
                boxShadow:tab===id?'0 1px 3px rgba(0,0,0,0.1)':'none'}}>
              {label}
            </button>
          ))}
        </div>
        {tab==='expenses'&&(
          <button className="btn btn-primary" onClick={()=>{ setEditing(null); setModal(true); }}>
            <Plus size={14}/> Add Expense
          </button>
        )}
      </div>

      {tab==='pnl' ? <PnLReport/> : (
        <>
          {/* Summary bar */}
          {totals&&(
            <div style={{display:'flex',gap:16,marginBottom:10,padding:'8px 14px',background:'#f8f9fa',borderRadius:6,border:'1px solid #e0e0e0',flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:'#888'}}>Showing {rows.length} of {paging?.total||0}</span>
              <span style={{fontSize:12,fontWeight:700,color:'#B71C1C'}}>Total: ${parseFloat(totals.total||0).toFixed(2)}</span>
              <span style={{fontSize:12,fontWeight:700,color:'#E65100'}}>This month: ${parseFloat(totals.month_total||0).toFixed(2)}</span>
            </div>
          )}

          {/* Filters */}
          <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,maxWidth:260}}>
              <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#aaa'}}/>
              <input className="form-input" style={{paddingLeft:28}} placeholder="Search vendor, description…"
                value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
            </div>
            <select className="filter-select" value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}>
              <option value="">All Categories</option>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={()=>qc.invalidateQueries(['expenses'])}><RefreshCw size={13}/></button>
          </div>

          {/* Table */}
          <div style={{border:'1px solid #ddd',borderRadius:6,overflow:'hidden',flex:1,display:'flex',flexDirection:'column'}}>
            <div style={{overflowY:'auto',flex:1}}>
              {isLoading ? <div style={{padding:40,textAlign:'center'}}><Spinner/></div>
              : !rows.length ? (
                <div style={{padding:'60px 24px',textAlign:'center',color:'#aaa'}}>
                  <DollarSign size={36} style={{marginBottom:12,opacity:0.2}}/><br/>
                  <p style={{fontSize:14,fontWeight:600,marginBottom:6}}>No expenses yet</p>
                  <button className="btn btn-primary btn-sm" onClick={()=>{ setEditing(null); setModal(true); }}>
                    <Plus size={12}/> Add First Expense
                  </button>
                </div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead style={{position:'sticky',top:0,zIndex:1}}>
                    <tr>{['Date','#','Category','Vendor','Description','Load','Driver','Amount','Method'].map(h=>(
                      <th key={h} style={TH}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.map(e=>(
                      <tr key={e.id} onContextMenu={ev=>rowCtx(ev,e)} onDoubleClick={()=>{ setEditing(e); setModal(true); }}
                        style={{cursor:'pointer'}}
                        onMouseEnter={ev=>ev.currentTarget.style.background='#f8fafd'}
                        onMouseLeave={ev=>ev.currentTarget.style.background=''}>
                        <td style={TD}>{fmt(e.expense_date)}</td>
                        <td style={{...TD,fontFamily:'monospace',fontSize:11,color:'#888'}}>{e.expense_number}</td>
                        <td style={TD}>
                          <span style={{fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:4,
                            background:(CAT_COLOR[e.category]||'#888')+'18',color:CAT_COLOR[e.category]||'#888'}}>
                            {CAT_ICON[e.category]||'📦'} {e.category}
                          </span>
                        </td>
                        <td style={TD}>{e.vendor||'—'}</td>
                        <td style={{...TD,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#555'}}>{e.description||'—'}</td>
                        <td style={{...TD,fontFamily:'monospace',fontSize:11,color:'#0063A3'}}>{e.load_number||'—'}</td>
                        <td style={{...TD,fontSize:11}}>{e.driver_name?.trim()||'—'}</td>
                        <td style={{...TD,textAlign:'right',fontWeight:700,color:'#B71C1C',whiteSpace:'nowrap'}}>${parseFloat(e.amount).toFixed(2)}</td>
                        <td style={{...TD,fontSize:11,color:'#888'}}>{e.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Pagination pagination={paging} onPage={setPage}/>
          </div>
        </>
      )}

      <ExpenseModal open={modal} editing={editing} onClose={()=>{setModal(false);setEditing(null);}} loads={loads} drivers={drivers}/>
      <Confirm open={!!confirmDel} onClose={()=>setConfirmDel(null)} danger
        onConfirm={()=>delMut.mutate(confirmDel?.id)}
        title="Delete Expense" message={`Delete ${confirmDel?.expense_number}?`}/>
      <ContextMenu {...menu} onClose={closeMenu}/>
    </div>
  );
}
