import React from 'react';
import { useTournamentsList } from '../hooks/useTournaments';

export default function TournamentListPage() {
  const { tournaments, loading, error, refetch } = useTournamentsList();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tournaments</h1>
      {loading && <p>Loading tournaments...</p>}
      {error && <p className="text-red-500">Failed to load tournaments</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments && tournaments.length ? tournaments.map(t => (
          <div key={t._id || t.id} className="p-4 bg-neutral-800 rounded shadow">
            <h3 className="text-lg font-semibold">{t.name}</h3>
            <p className="text-sm text-neutral-400">Stage: {t.stage}</p>
            <p className="text-sm text-neutral-400">Teams: {t.teams ? t.teams.length : 0}</p>
          </div>
        )) : <p>No tournaments found</p>}
      </div>
    </div>
  );
}
