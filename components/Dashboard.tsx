import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Connection } from '../types';
import { Activity, HardDrive, ShieldCheck, UploadCloud } from 'lucide-react';

interface DashboardProps {
  connections: Connection[];
}

const Dashboard: React.FC<DashboardProps> = ({ connections }) => {
  const data = connections.map(c => ({
    name: c.name,
    used: c.storageUsed || 0,
    total: c.storageLimit || 100,
  }));

  const stats = [
    { title: 'Transferências Ativas', value: '4', icon: Activity, color: 'text-blue-400' },
    { title: 'Volume de Dados', value: '1.2 TB', icon: HardDrive, color: 'text-purple-400' },
    { title: 'Backups Seguros', value: '100%', icon: ShieldCheck, color: 'text-green-400' },
    { title: 'Velocidade Média', value: '45 MB/s', icon: UploadCloud, color: 'text-orange-400' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Visão Geral</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-slate-800 rounded-lg ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-1 rounded">Hoje</span>
            </div>
            <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
            <p className="text-sm text-slate-500 mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-6">Uso de Armazenamento (GB)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                />
                <Bar dataKey="used" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Conexões Recentes</h3>
          <div className="space-y-4">
            {connections.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${c.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.type}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{c.lastSync}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;