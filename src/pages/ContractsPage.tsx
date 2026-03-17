import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTenantContracts, getOwnerContracts } from '../services/contractService';
import { getOwnerProperties } from '../services/propertyService';
import ContractViewer from '../components/ContractViewer';
import type { Contract, Property } from '../types';

export default function ContractsPage() {
  const { userProfile } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    const load = async () => {
      if (userProfile.role === 'tenant') {
        setContracts(await getTenantContracts(userProfile.id));
      } else {
        const [ctrs, props] = await Promise.all([
          getOwnerContracts(userProfile.id),
          getOwnerProperties(userProfile.id),
        ]);
        setContracts(ctrs);
        setProperties(props);
      }
      setLoading(false);
    };
    load();
  }, [userProfile]);

  if (!userProfile) return null;

  return (
    <div className="container page">
      <div className="page-header">
        <h1 className="page-title">Contracts</h1>
        <p className="page-subtitle">
          {userProfile.role === 'tenant' ? 'Your rental agreements' : 'All tenant contracts'}
        </p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : contracts.length === 0 ? (
        <div className="empty-state">
          <h3>No contracts found</h3>
          <p>{userProfile.role === 'owner' ? 'Create a contract from the Owner Dashboard.' : 'No contracts have been assigned to you yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
          {contracts.map(c => {
            const prop = properties.find(p => p.id === c.propertyId);
            return <ContractViewer key={c.id} contract={c} propertyTitle={prop?.title} />;
          })}
        </div>
      )}
    </div>
  );
}
