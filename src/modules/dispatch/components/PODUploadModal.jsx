import React, { useState, useRef } from 'react';
import { Upload, SkipForward, FileImage, Check } from 'lucide-react';
import { Modal, Button } from '../../../shared/components';
import toast from 'react-hot-toast';

export default function PODUploadModal({ loadId, onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      // In production, upload to API
      // const formData = new FormData();
      // formData.append('pod', file);
      // await api.post(`/loads/${loadId}/pod`, formData);
      toast.success('POD uploaded');
      onClose();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Proof of Delivery" size="sm" footer={
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>
          <SkipForward size={14} /> Skip POD
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading}>
          <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload POD'}
        </Button>
      </div>
    }>
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Upload proof of delivery for load <b>{loadId}</b>
        </div>

        <input ref={inputRef} type="file" accept="image/*,.pdf"
          onChange={handleFileChange} style={{ display: 'none' }} />

        {!file ? (
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)', borderRadius: 8,
              padding: '24px 16px', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 12,
            }}
          >
            <Upload size={24} style={{ marginBottom: 8 }} />
            <div>Click to select photo or PDF</div>
          </div>
        ) : (
          <div style={{
            border: '1px solid var(--border)', borderRadius: 8,
            padding: 12, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <FileImage size={16} />
            <span style={{ flex: 1, fontSize: 12, textAlign: 'left' }}>{file.name}</span>
            <Check size={14} style={{ color: 'var(--success)' }} />
          </div>
        )}
      </div>
    </Modal>
  );
}
