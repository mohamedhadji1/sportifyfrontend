import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const TournamentPlanning = ({ tournament, onPlanningComplete }) => {
  const { token: contextToken } = useAuth();
  const token = contextToken || localStorage.getItem('token') || localStorage.getItem('authToken') || '';
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '09:00',
    endDate: '',
    registrationDeadline: '',
    maxPlayersPerTeam: tournament.maxPlayersPerTeam || 6,
    matchDurationMinutes: tournament.matchDurationMinutes || 90,
    daysBetweenRounds: 1,
    prizePool: {
      total: tournament.prizePool?.total || 0,
      currency: tournament.prizePool?.currency || 'TND',
      breakdown: tournament.prizePool?.breakdown || [
        { position: 1, amount: 0, percentage: 50 },
        { position: 2, amount: 0, percentage: 30 },
        { position: 3, amount: 0, percentage: 20 }
      ]
    },
    rules: {
      allowExtraTime: tournament.rules?.allowExtraTime || false,
      allowPenalties: tournament.rules?.allowPenalties || true,
      substitutionsAllowed: tournament.rules?.substitutionsAllowed || 3,
      yellowCardLimit: tournament.rules?.yellowCardLimit || 2,
      redCardSuspension: tournament.rules?.redCardSuspension || 1
    }
  });

  const [updating, setUpdating] = useState(false);

  // Calculate prize breakdown based on total
  const updatePrizeBreakdown = (total) => {
    const breakdown = formData.prizePool.breakdown.map(item => ({
      ...item,
      amount: Math.round((total * item.percentage) / 100)
    }));
    
    setFormData(prev => ({
      ...prev,
      prizePool: {
        ...prev.prizePool,
        total: total,
        breakdown: breakdown
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const scheduleData = {
        startDate: formData.startDate,
        startTime: formData.startTime,
        matchDurationMinutes: formData.matchDurationMinutes,
        daysBetweenRounds: formData.daysBetweenRounds
      };

      // Note: companyId will be automatically derived by the backend middleware from the tournament
      // No need to fetch profile or include companyId in the request

      console.log('Schedule data being sent:', scheduleData);
      console.log('Token present:', token ? 'Yes' : 'No');
      console.log('Tournament ID:', tournament._id);

      // Essayons d'abord l'API, sinon on continue localement
      try {
        const response = await fetch(`http://localhost:5006/api/tournaments/${tournament._id}/schedule`, {
          method: 'POST',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scheduleData)
        });

        const responseData = await response.json();
        console.log('API Response:', response.status, responseData);

        if (response.ok) {
          onPlanningComplete(responseData);
        } else {
          console.error('API Error:', responseData);
          alert(`Error: ${responseData.message || 'Failed to schedule tournament'}`);
          
          // Si l'API échoue, on continue avec les données locales
          console.warn('API update failed, continuing with local data');
          const localTournament = {
            ...tournament,
            ...formData,
            scheduled: true,
            updatedAt: new Date().toISOString()
          };
          onPlanningComplete(localTournament);
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        // Si l'API échoue complètement, on continue avec les données locales
        const localTournament = {
          ...tournament,
          ...formData,
          scheduled: true,
          updatedAt: new Date().toISOString()
        };
        onPlanningComplete(localTournament);
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      alert('Erreur lors de la mise à jour du tournoi');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] py-4 px-2 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto bg-[#16213A] rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-blue-900">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
            <span className="text-blue-400">📅</span> Tournament Planning
          </h2>
          <p className="text-white/70 text-base sm:text-lg">
            Set up your tournament dates, rules, and prizes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Calendar Section */}
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="text-blue-400 text-2xl">📅</span>
              Tournament Calendar
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-gray-900 border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full bg-gray-900 border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-gray-900 border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Registration Deadline
                </label>
                <input
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, registrationDeadline: e.target.value }))}
                  className="w-full bg-gray-900 border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Match Configuration */}
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="text-green-400 text-2xl">⚽</span>
              Match Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Max Players per Team
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxPlayersPerTeam}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxPlayersPerTeam: parseInt(e.target.value) }))}
                  className="w-full bg-gray-900 border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Match Duration (minutes)
                </label>
                <input
                  type="number"
                  min="30"
                  max="120"
                  value={formData.matchDurationMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, matchDurationMinutes: parseInt(e.target.value) }))}
                  className="w-full bg-gray-900 border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Prize Pool */}
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="text-yellow-400 text-2xl">💰</span>
              Prizes & Rewards
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Total Prize Pool
                  </label>
                  <div className="flex flex-col sm:flex-row">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.prizePool.total}
                      onChange={(e) => updatePrizeBreakdown(parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-gray-900 border border-white/20 rounded-t-xl sm:rounded-l-xl sm:rounded-t-none px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <div className="bg-gray-900 border border-white/20 rounded-b-xl sm:rounded-r-xl sm:rounded-b-none px-3 py-2 sm:px-4 sm:py-3 text-white font-medium">
                      {formData.prizePool.currency}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.prizePool.currency}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      prizePool: { ...prev.prizePool, currency: e.target.value }
                    }))}
                    className="w-full bg-gray-900 border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="TND">TND (Tunisian Dinar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
              </div>
              {/* Prize Breakdown */}
              <div>
                <h4 className="text-lg font-medium text-white mb-4">Prize Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {formData.prizePool.breakdown.map((prize, index) => (
                    <div key={prize.position} className="bg-gray-900 rounded-lg p-4 border border-white/20">
                      <div className="text-center">
                        <div className={`text-2xl mb-2 ${
                          index === 0 ? 'text-yellow-400' : 
                          index === 1 ? 'text-gray-400' : 'text-amber-600'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <div className="font-semibold text-white">
                          {prize.position === 1 ? '1st Place' : 
                           prize.position === 2 ? '2nd Place' : '3rd Place'}
                        </div>
                        <div className="text-sm text-white/60 mb-2">
                          {prize.percentage}% of total
                        </div>
                        <div className="text-lg font-bold text-white">
                          {prize.amount} {formData.prizePool.currency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="text-purple-400 text-2xl">📋</span>
              Game Rules
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-white/20">
                  <div>
                    <div className="font-medium text-white">Allow Extra Time</div>
                    <div className="text-sm text-white/60">Enable extra time in case of a draw</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rules.allowExtraTime}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        rules: { ...prev.rules, allowExtraTime: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-white/20">
                  <div>
                    <div className="font-medium text-white">Allow Penalties</div>
                    <div className="text-sm text-white/60">Enable penalty shootouts</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rules.allowPenalties}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        rules: { ...prev.rules, allowPenalties: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Substitutions Allowed
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.rules.substitutionsAllowed}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rules: { ...prev.rules, substitutionsAllowed: parseInt(e.target.value) }
                    }))}
                    className="w-full bg-gray-900 border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Yellow Card Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rules.yellowCardLimit}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rules: { ...prev.rules, yellowCardLimit: parseInt(e.target.value) }
                    }))}
                    className="w-full bg-gray-900 border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-6">
            <button
              type="submit"
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg w-full sm:w-auto"
            >
              {updating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Updating...
                </div>
              ) : (
                '🚀 Confirm Planning'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentPlanning;