'use client';

import {useEffect,useState} from 'react';
import {BaseButton} from '@ultrst-armada/floks/ui';
import {apiClient} from '../../../../../libraries/client/apiClient.js';

type SrklAccount={id?:string;service?:string;name?:string;label?:string;status?:string};

export default function AccountsTab(){
  const[accounts,setAccounts]=useState<SrklAccount[]>([]);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState<string|null>(null);

  const sync=async()=>{
    setLoading(true);
    try{
      const result=await apiClient.getSrklAccounts();
      const next=Array.isArray(result?.accounts)?result.accounts:[];
      setAccounts(next);
      setError(null);
    }catch(cause){
      setError(cause instanceof Error?cause.message:String(cause));
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{void sync();},[]);

  return <section style={{padding:24,maxWidth:900}}>
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      <div><h2>Accounts</h2><p>Canonical SRKL account discovery for connected external services.</p></div>
      <BaseButton size="sm" variant="secondary" onClick={()=>void sync()} disabled={loading}>{loading?'Syncing…':'Sync from SRKL'}</BaseButton>
    </div>
    {error&&<p role="alert">{error}</p>}
    {accounts.length===0&&!loading?<p>No SRKL accounts are available for this user.</p>:<ul>{accounts.map((account,index)=><li key={account.id??`${account.service??'account'}-${index}`}>{account.name??account.label??account.id??'Unnamed account'} · {account.service??'unknown service'} · {account.status??'available'}</li>)}</ul>}
  </section>;
}