import React from 'react';
import { Truck, Printer, Download, XCircle } from 'lucide-react';
import { Button } from '../../../shared/components';

export default function LoadBulkBar({ count, onAssignTrip, onPrintBol, onExport, onCancel }) {
  if (!count) return null;
  return (
    <div className="loads-bulk-bar">
      <span>{count} load{count !== 1 ? 's' : ''} selected</span>
      <div style={{ flex: 1 }} />
      <Button size="xs" icon={Truck} onClick={onAssignTrip}>Assign to Trip</Button>
      <Button size="xs" variant="secondary" icon={Printer} onClick={onPrintBol}>Print BOL</Button>
      <Button size="xs" variant="secondary" icon={Download} onClick={onExport}>Export</Button>
      <Button size="xs" variant="danger" icon={XCircle} onClick={onCancel}>Cancel Selected</Button>
    </div>
  );
}
