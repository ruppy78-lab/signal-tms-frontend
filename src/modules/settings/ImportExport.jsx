import React, { useState } from 'react';
import { Upload, Download, FileArchive } from 'lucide-react';

const moduleConfig = {
  Customers:    { import: ['CSV', 'Excel (.xlsx)'],                          export: ['CSV', 'Excel (.xlsx)', 'TMS Format'] },
  Loads:        { import: ['CSV', 'Excel (.xlsx)'],                          export: ['CSV', 'Excel (.xlsx)', 'EDI 204'] },
  Carriers:     { import: ['CSV', 'Excel (.xlsx)', 'FMCSA Safety Data'],     export: ['CSV', 'Excel (.xlsx)'] },
  Drivers:      { import: ['CSV', 'Excel (.xlsx)'],                          export: ['CSV', 'Excel (.xlsx)'] },
  Invoices:     { import: [],                                                export: ['CSV', 'Excel (.xlsx)', 'QuickBooks IIF'] },
  Settlements:  { import: [],                                                export: ['CSV', 'Excel (.xlsx)', 'QuickBooks IIF'] },
  'All Data':   { import: [],                                                export: ['Full Backup ZIP'] },
};

const moduleList = Object.keys(moduleConfig);

export default function ImportExportPage() {
  const [importModule, setImportModule] = useState('Customers');
  const [importFormat, setImportFormat] = useState('');
  const [exportModule, setExportModule] = useState('Customers');
  const [exportFormat, setExportFormat] = useState('');

  const importFormats = moduleConfig[importModule]?.import || [];
  const exportFormats = moduleConfig[exportModule]?.export || [];
  const importModules = moduleList.filter(m => moduleConfig[m].import.length > 0);
  const canImport = importFormats.length > 0;

  return (
    <div>
      <h3 className="settings-page-title">Import / Export Data</h3>
      <p className="settings-page-desc">
        Import data from CSV/Excel or export to various formats including QuickBooks and EDI.
      </p>

      <div className="ie-sections">
        {/* IMPORT */}
        <div className="card">
          <div className="card-header"><Upload size={14} /> Import Data</div>
          <div className="card-body">
            <div className="form-grid">
              <div>
                <label className="form-label">Module</label>
                <select
                  className="form-input"
                  value={importModule}
                  onChange={(e) => { setImportModule(e.target.value); setImportFormat(''); }}
                >
                  {importModules.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Format</label>
                <select
                  className="form-input"
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value)}
                  disabled={!canImport}
                >
                  <option value="">Select format...</option>
                  {importFormats.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="full">
                <label className="form-label">Upload File</label>
                <input type="file" className="form-input" accept=".csv,.xlsx,.xls" disabled={!importFormat} />
              </div>
            </div>
            <div className="ie-format-info">
              <strong>Supported formats for {importModule}:</strong>
              {importFormats.length > 0
                ? importFormats.join(', ')
                : 'Import not available for this module'}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={!importFormat}>
              <Upload size={13} /> Import Records
            </button>
          </div>
        </div>

        {/* EXPORT */}
        <div className="card">
          <div className="card-header"><Download size={14} /> Export Data</div>
          <div className="card-body">
            <div className="form-grid">
              <div>
                <label className="form-label">Module</label>
                <select
                  className="form-input"
                  value={exportModule}
                  onChange={(e) => { setExportModule(e.target.value); setExportFormat(''); }}
                >
                  {moduleList.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Format</label>
                <select
                  className="form-input"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="">Select format...</option>
                  {exportFormats.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              {exportModule !== 'All Data' && (
                <>
                  <div>
                    <label className="form-label">From Date</label>
                    <input type="date" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">To Date</label>
                    <input type="date" className="form-input" />
                  </div>
                </>
              )}
            </div>
            <div className="ie-format-info">
              <strong>Export formats for {exportModule}:</strong>{' '}
              {exportFormats.join(', ')}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={!exportFormat}>
              <Download size={13} /> Export Now
            </button>
          </div>
        </div>

        {/* FORMAT REFERENCE */}
        <div className="card">
          <div className="card-header"><FileArchive size={14} /> Format Reference</div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="tms-table">
              <thead>
                <tr><th>Module</th><th>Import From</th><th>Export To</th></tr>
              </thead>
              <tbody>
                {moduleList.map(m => (
                  <tr key={m}>
                    <td>{m}</td>
                    <td>{moduleConfig[m].import.length > 0 ? moduleConfig[m].import.join(', ') : '—'}</td>
                    <td>{moduleConfig[m].export.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
