import React, { useState, useEffect } from 'react';
import { Button } from '../../../shared/components';
import toast from 'react-hot-toast';
import DriverFormDetails from './form/DriverFormDetails';
import DriverFormDocs from './form/DriverFormDocs';
import DriverFormTrips from './form/DriverFormTrips';
import DriverFormSettlements from './form/DriverFormSettlements';
import DriverFormNotes from './form/DriverFormNotes';
import driversApi from '../services/driversApi';
import api from '../../../shared/services/api';
import { X } from 'lucide-react';

const TABS = [
  'Details', 'Documents', 'Trip History', 'Settlements', 'Notes'
];

const empty = {
  first_name: '', last_name: '', middle_name: '',
  email: '', phone: '', mobile: '',
  license_number: '', license_class: '', license_state: '',
  license_expiry: '', license_endorsements: '',
  license_restrictions: '',
  medical_card_number: '', medical_card_expiry: '',
  abstract_date: '', cvor_date: '', drug_test_date: '',
  criminal_check_date: '',
  driver_type: 'company', default_pay_type: 'flat',
  default_pay_rate: '', pay_period: 'weekly',
  pay_rate_type: 'pallet', per_mile_rate: '', hourly_rate: '',
  use_custom_pallet_rate: false,
  custom_first_pallet_rate: '',
  custom_additional_pallet_rate: '',
  is_owner_operator: false, owner_op_rate_type: '',
  owner_op_rate: '',
  date_of_birth: '', hire_date: '', driver_code: '',
  address: '', city: '', state: '', zip: '',
  emergency_contact: '', emergency_phone: '', sms_number: '',
  alert_email: true, alert_sms: false,
  alert_on_dispatch: true, alert_on_load_added: true,
  alert_on_cancellation: true,
  company_name: '', mc_number: '', dot_number: '',
  gst_number: '',
  bank_name: '', bank_account: '', bank_transit: '',
  fuel_surcharge_split: 0, accessorial_split: 0,
  notes: '', status: 'available',
};

const fmtDate = (v) => v ? String(v).split('T')[0] : '';

export default function DriverForm({
  open, onClose, driver, onSave, onDelete, driverType: initType
}) {
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [palletRates, setPalletRates] = useState({
    default_first_pallet_rate: 35,
    default_additional_pallet_rate: 10
  });
  const [pendingDocs, setPendingDocs] = useState([]);

  const isEdit = !!driver?.id;

  // FIX 1: Removed isEdit from dependency array.
  // isEdit is derived from driver which is already in deps.
  // Having isEdit caused useEffect to re-run when
  // getPalletRates() resolved, resetting tab to 0.
  useEffect(() => {
    if (!open) return;
    setTab(0);
    setPendingDocs([]);
    if (driver?.id) {
      const f = { ...empty };
      for (const [k, v] of Object.entries(driver)) {
        if (k in f) f[k] = v ?? empty[k];
      }
      ['license_expiry','medical_card_expiry','abstract_date',
       'cvor_date','drug_test_date','criminal_check_date',
       'date_of_birth','hire_date'].forEach(k => {
        f[k] = fmtDate(f[k]);
      });
      setForm(f);
    } else {
      setForm({
        ...empty,
        driver_type: initType || 'company',
        is_owner_operator: initType === 'owner_op'
      });
    }
    driversApi.getPalletRates().then(r => {
      if (r.data) setPalletRates(r.data);
      else if (r) setPalletRates(r);
    }).catch(() => {});
  }, [open, driver, initType]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const uploadPendingDocs = async (driverId) => {
    for (const doc of pendingDocs) {
      try {
        const fd = new FormData();
        fd.append('file', doc.file);
        fd.append('doc_type', doc.doc_type);
        fd.append('entity_type', 'driver');
        fd.append('entity_id', driverId);
        if (doc.doc_name) fd.append('doc_name', doc.doc_name);
        if (doc.expiry_date)
          fd.append('expiry_date', doc.expiry_date);
        await api.post('/documents/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch { /* individual doc failure won't block save */ }
    }
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast.error('First and last name required');
      return;
    }
    setSaving(true);
    try {
      const result = await onSave(form);
      if (pendingDocs.length > 0) {
        // Axios wraps backend JSON in .data. If backend returns { data: { id } }
        // the real path is result.data.data.id — check all three levels.
        const newId = result?.data?.data?.id || result?.data?.id || result?.id;
        if (newId) {
          await uploadPendingDocs(newId);
          toast.success(
            `Driver saved with ${pendingDocs.length} ` +
            `document${pendingDocs.length > 1 ? 's' : ''}`
          );
        }
      }
      onClose();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  };

  const title = isEdit
    ? `Edit — ${driver.first_name} ${driver.last_name}`
    : form.driver_type === 'owner_op'
      ? 'Add Owner Operator'
      : 'Add Company Driver';

  if (!open) return null;

  // FIX 2: NOT using shared Modal component.
  // Building our own modal gives 100% control.
  // No shared Modal = no shared Modal bugs.
  // Modal ONLY closes via X, Cancel, or Save.
  // Tab clicks CANNOT close this modal.
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        role="dialog"
        className="modal-driver-form"
        style={{
          background: '#fff',
          borderRadius: 8,
          width: '90vw',
          maxWidth: 1100,
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: '#003865',
          color: '#fff',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            {title}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'none', border: 'none',
              color: '#fff', cursor: 'pointer', padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            borderBottom: '1px solid #e0e0e0',
            padding: '0 20px',
            background: '#fff',
            flexShrink: 0,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {TABS.map((t, i) => (
            <button
              key={t}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setTab(i);
              }}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: tab === i
                  ? '2px solid #003865'
                  : '2px solid transparent',
                background: 'none',
                color: tab === i ? '#003865' : '#666',
                fontWeight: tab === i ? 700 : 400,
                fontSize: 13,
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            minHeight: 500,
            boxSizing: 'border-box',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {tab === 0 && (
            <DriverFormDetails
              form={form} set={set} palletRates={palletRates}
            />
          )}
          {tab === 1 && (
            <DriverFormDocs
              driverId={driver?.id}
              pendingDocs={pendingDocs}
              setPendingDocs={setPendingDocs}
            />
          )}
          {tab === 2 && (
            <DriverFormTrips driverId={driver?.id} />
          )}
          {tab === 3 && (
            <DriverFormSettlements driverId={driver?.id} />
          )}
          {tab === 4 && (
            <DriverFormNotes form={form} set={set} />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            background: '#f8fafc',
            flexShrink: 0,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div>
            {isEdit && onDelete && (
              <Button
                variant="danger"
                onClick={async () => {
                  if (!window.confirm(`Deactivate ${driver.first_name} ${driver.last_name}?`)) return;
                  try {
                    await onDelete(driver.id);
                    onClose();
                  } catch (e) {
                    toast.error('Delete failed');
                  }
                }}
              >
                Delete
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {saving
                ? 'Saving...'
                : pendingDocs.length > 0
                  ? `Save Driver + ${pendingDocs.length} Doc${pendingDocs.length > 1 ? 's' : ''}`
                  : 'Save Driver'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
