import React from 'react';
import { AlertTriangle } from 'lucide-react';

const LICENSE_CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class A', 'Class B', 'Class C', 'Other'];

function ExpiryAlert({ date, label }) {
  if (!date) return null;
  const days = Math.floor((new Date(date) - new Date()) / 86400000);
  if (days > 60) return null;
  const expired = days < 0;
  const color = expired || days < 30 ? '#B71C1C' : '#92400E';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', marginBottom: 8,
      borderRadius: 4, background: expired ? '#FEF2F2' : '#FFF7ED', fontSize: 11, color }}>
      <AlertTriangle size={12} />
      {expired ? `${label} EXPIRED` : `${label} expires in ${days} days`}
    </div>
  );
}

function calcPay(pallets, first, add) {
  if (pallets <= 0) return 0;
  if (pallets === 1) return first;
  return first + (pallets - 1) * add;
}

export default function DriverFormDetails({ form, set, palletRates = {} }) {
  const isOwnerOp = form.driver_type === 'owner_op';
  const globalFirst = parseFloat(palletRates.default_first_pallet_rate) || 35;
  const globalAdd = parseFloat(palletRates.default_additional_pallet_rate) || 10;
  const useCustom = form.use_custom_pallet_rate;
  const firstRate = useCustom ? (parseFloat(form.custom_first_pallet_rate) || 0) : globalFirst;
  const addRate = useCustom ? (parseFloat(form.custom_additional_pallet_rate) || 0) : globalAdd;

  return (
    <div>
      {/* Driver Type Toggle + Top Fields */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button className={`btn btn-sm ${form.driver_type === 'company' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { set('driver_type', 'company'); set('is_owner_operator', false); }}>Company Driver</button>
        <button className={`btn btn-sm ${form.driver_type === 'owner_op' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { set('driver_type', 'owner_op'); set('is_owner_operator', true); }}>Owner Operator</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><label className="form-label">First Name *</label>
          <input className="form-input" name="first_name" value={form.first_name} onChange={e => set('first_name', e.target.value)} /></div>
        <div><label className="form-label">Middle Name</label>
          <input className="form-input" name="middle_name" value={form.middle_name} onChange={e => set('middle_name', e.target.value)} /></div>
        <div><label className="form-label">Last Name *</label>
          <input className="form-input" name="last_name" value={form.last_name} onChange={e => set('last_name', e.target.value)} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div><label className="form-label">Phone</label>
          <input className="form-input" name="phone" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
        <div><label className="form-label">Mobile</label>
          <input className="form-input" name="mobile" value={form.mobile} onChange={e => set('mobile', e.target.value)} /></div>
        <div><label className="form-label">Email</label>
          <input className="form-input" name="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div><label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="available">Available</option><option value="on_trip">On Trip</option>
            <option value="inactive">Inactive</option><option value="on_leave">On Leave</option>
          </select></div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
      {/* LEFT COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="form-section-header">Personal Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><label className="form-label">Date of Birth</label>
            <input className="form-input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></div>
          <div><label className="form-label">Hire Date</label>
            <input className="form-input" type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} /></div>
        </div>

        <div className="form-section-header">Address</div>
        <div><label className="form-label">Street Address</label>
          <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div><label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} /></div>
          <div><label className="form-label">Province / State</label>
            <input className="form-input" value={form.state} onChange={e => set('state', e.target.value)} /></div>
          <div><label className="form-label">Postal / ZIP</label>
            <input className="form-input" value={form.zip} onChange={e => set('zip', e.target.value)} /></div>
        </div>

        <div className="form-section-header">Emergency Contact</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><label className="form-label">Emergency Contact Name</label>
            <input className="form-input" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} /></div>
          <div><label className="form-label">Emergency Phone</label>
            <input className="form-input" value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)} /></div>
        </div>

        {/* Notifications */}
        <div className="form-section-header">Notifications</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 6 }}>
              <input type="checkbox" checked={form.alert_email} onChange={e => set('alert_email', e.target.checked)} /> Email Alerts</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input type="checkbox" checked={form.alert_sms} onChange={e => set('alert_sms', e.target.checked)} /> SMS Alerts</label>
            {form.alert_sms && (
              <div style={{ marginTop: 6 }}><label className="form-label">SMS Number</label>
                <input className="form-input" value={form.sms_number} onChange={e => set('sms_number', e.target.value)} /></div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#666666', marginBottom: 6 }}>ALERT WHEN:</div>
            {[['alert_on_dispatch','Dispatched to a trip'],['alert_on_load_added','Load added to trip'],['alert_on_cancellation','Trip cancelled']].map(([k,l])=>(
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 4 }}>
                <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} /> {l}</label>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="form-section-header">License Information</div>
        <ExpiryAlert date={form.license_expiry} label="License" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><label className="form-label">License Number</label>
            <input className="form-input" value={form.license_number} onChange={e => set('license_number', e.target.value)} /></div>
          <div><label className="form-label">License Class</label>
            <select className="form-input" value={form.license_class} onChange={e => set('license_class', e.target.value)}>
              <option value="">Select...</option>
              {LICENSE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="form-label">License Province/State</label>
            <input className="form-input" value={form.license_state} onChange={e => set('license_state', e.target.value)} /></div>
          <div><label className="form-label">License Expiry</label>
            <input className="form-input" type="date" value={form.license_expiry} onChange={e => set('license_expiry', e.target.value)} /></div>
        </div>
        <div><label className="form-label">Endorsements</label>
          <input className="form-input" value={form.license_endorsements} onChange={e => set('license_endorsements', e.target.value)} placeholder="HazMat, Tanker, Doubles..." /></div>
        <div><label className="form-label">Restrictions</label>
          <input className="form-input" value={form.license_restrictions} onChange={e => set('license_restrictions', e.target.value)} /></div>

        <div className="form-section-header">Medical Card</div>
        <ExpiryAlert date={form.medical_card_expiry} label="Medical card" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><label className="form-label">Medical Card Number</label>
            <input className="form-input" value={form.medical_card_number} onChange={e => set('medical_card_number', e.target.value)} /></div>
          <div><label className="form-label">Medical Card Expiry</label>
            <input className="form-input" type="date" value={form.medical_card_expiry} onChange={e => set('medical_card_expiry', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div><label className="form-label">Last Drug Test</label>
            <input className="form-input" type="date" value={form.drug_test_date} onChange={e => set('drug_test_date', e.target.value)} /></div>
          <div><label className="form-label">Abstract (MVR)</label>
            <input className="form-input" type="date" value={form.abstract_date} onChange={e => set('abstract_date', e.target.value)} /></div>
          <div><label className="form-label">CVOR Date</label>
            <input className="form-input" type="date" value={form.cvor_date} onChange={e => set('cvor_date', e.target.value)} /></div>
        </div>

        {/* Employment */}
        <div className="form-section-header">Employment</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><label className="form-label">Driver Code</label>
            <input className="form-input" value={form.driver_code} onChange={e => set('driver_code', e.target.value)} placeholder="Auto-generated" /></div>
          <div><label className="form-label">Criminal Check</label>
            <input className="form-input" type="date" value={form.criminal_check_date} onChange={e => set('criminal_check_date', e.target.value)} /></div>
        </div>

        {/* Pay Rate Section */}
        <div className="form-section-header">Pay Rate</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {[['pallet','Pallet Rate'],['per_mile','Per Mile'],['hourly','Hourly']].map(([v,l])=>(
            <button key={v} className={`btn btn-xs ${form.pay_rate_type===v?'btn-primary':'btn-secondary'}`}
              onClick={()=>set('pay_rate_type',v)}>{l}</button>
          ))}
        </div>

        {form.pay_rate_type === 'pallet' && (
          <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, border: '1px solid #e0e0e0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 8 }}>
              <input type="checkbox" checked={form.use_custom_pallet_rate || false}
                onChange={e => set('use_custom_pallet_rate', e.target.checked)} />
              <strong>Use custom pallet rate</strong>
            </label>
            {form.use_custom_pallet_rate && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div><label className="form-label">First Pallet Rate</label>
                  <input className="form-input" type="number" step="0.01" value={form.custom_first_pallet_rate}
                    onChange={e => set('custom_first_pallet_rate', e.target.value)} /></div>
                <div><label className="form-label">Additional Pallet Rate</label>
                  <input className="form-input" type="number" step="0.01" value={form.custom_additional_pallet_rate}
                    onChange={e => set('custom_additional_pallet_rate', e.target.value)} /></div>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#666666', marginBottom: 4 }}>
              {!form.use_custom_pallet_rate && <span>Using global rate: ${globalFirst.toFixed(2)} first, ${globalAdd.toFixed(2)} each additional</span>}
            </div>
            <div style={{ fontSize: 11, color: '#003865', fontWeight: 600 }}>
              1 pallet = ${firstRate.toFixed(2)} | 5 pallets = ${calcPay(5, firstRate, addRate).toFixed(2)} | 10 pallets = ${calcPay(10, firstRate, addRate).toFixed(2)}
            </div>
          </div>
        )}

        {form.pay_rate_type === 'per_mile' && (
          <div><label className="form-label">Rate per Mile ($)</label>
            <input className="form-input" type="number" step="0.01" value={form.per_mile_rate}
              onChange={e => set('per_mile_rate', e.target.value)} /></div>
        )}

        {form.pay_rate_type === 'hourly' && (
          <div><label className="form-label">Hourly Rate ($)</label>
            <input className="form-input" type="number" step="0.01" value={form.hourly_rate}
              onChange={e => set('hourly_rate', e.target.value)} /></div>
        )}

        {/* Legacy fields for backwards compat */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><label className="form-label">Default Pay Rate</label>
            <input className="form-input" type="number" step="0.01" value={form.default_pay_rate} onChange={e => set('default_pay_rate', e.target.value)} /></div>
          <div><label className="form-label">Pay Period</label>
            <select className="form-input" value={form.pay_period} onChange={e => set('pay_period', e.target.value)}>
              <option value="weekly">Weekly</option><option value="biweekly">Bi-Weekly</option><option value="monthly">Monthly</option>
            </select></div>
        </div>

        {/* Owner Operator Extra Fields */}
        {isOwnerOp && (
          <>
            <div className="form-section-header">Owner Operator Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><label className="form-label">Company Name</label>
                <input className="form-input" value={form.company_name} onChange={e => set('company_name', e.target.value)} /></div>
              <div><label className="form-label">GST/HST Number</label>
                <input className="form-input" value={form.gst_number} onChange={e => set('gst_number', e.target.value)} /></div>
              <div><label className="form-label">MC Number</label>
                <input className="form-input" value={form.mc_number} onChange={e => set('mc_number', e.target.value)} /></div>
              <div><label className="form-label">DOT Number</label>
                <input className="form-input" value={form.dot_number} onChange={e => set('dot_number', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div><label className="form-label">Bank Name</label>
                <input className="form-input" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} /></div>
              <div><label className="form-label">Account #</label>
                <input className="form-input" value={form.bank_account} onChange={e => set('bank_account', e.target.value)} /></div>
              <div><label className="form-label">Transit #</label>
                <input className="form-input" value={form.bank_transit} onChange={e => set('bank_transit', e.target.value)} /></div>
            </div>
            <div className="form-section-header">Owner Op Rate</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><label className="form-label">Rate Type</label>
                <select className="form-input" value={form.owner_op_rate_type || ''} onChange={e => set('owner_op_rate_type', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="flat">Flat Per Trip</option>
                  <option value="percentage">Percentage</option>
                  <option value="per_km">Per KM</option>
                </select></div>
              <div><label className="form-label">Rate</label>
                <input className="form-input" type="number" step="0.01" value={form.owner_op_rate}
                  onChange={e => set('owner_op_rate', e.target.value)} /></div>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
