import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Spinner } from '../../../shared/components';
import DriverFormDocs from '../components/form/DriverFormDocs';
import driversApi from '../services/driversApi';

export default function DriverDocumentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversApi.getById(id)
      .then(r => setDriver(r.data || r))
      .catch(() => setDriver(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>;
  if (!driver) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Driver not found</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/drivers')}>Back</Button>
          <div>
            <div className="page-title">{driver.first_name} {driver.last_name} — Documents</div>
            <div className="page-subtitle">{driver.driver_code || ''}</div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <DriverFormDocs driverId={id} />
        </div>
      </div>
    </div>
  );
}
