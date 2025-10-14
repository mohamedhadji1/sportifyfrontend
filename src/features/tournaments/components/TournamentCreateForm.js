import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getImageUrl } from '../../../shared/utils/imageUtils';
import { useToast, ToastContainer } from '../../../shared/ui/components/Toast';

const TOURNAMENT_API = process.env.REACT_APP_TOURNAMENT_SERVICE_URL || 'http://localhost:5006/api/tournaments';
const COMPANY_API = (process.env.REACT_APP_COMPANY_SERVICE_URL || 'https://sportify-company.onrender.com').replace(/\/$/, '');

// Fetch manager's companies
async function fetchMyCompanies() {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(`${COMPANY_API}/api/companies/mine`, { headers });
  return res.data;
}

export default function TournamentCreateForm({ onCreated }) {
  const [name, setName] = useState('');
  const [sport, setSport] = useState('football');
  const [maxTeams, setMaxTeams] = useState(8);
  const [poolCount, setPoolCount] = useState(2);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(6);
  const [matchDurationMinutes, setMatchDurationMinutes] = useState(90);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Rules state
  const [rulesDescription, setRulesDescription] = useState('');
  const [allowOvertime, setAllowOvertime] = useState(false);
  const [overtimeMinutes, setOvertimeMinutes] = useState(15);
  
  // Prize pool state
  const [totalPrizePool, setTotalPrizePool] = useState(0);
  const [prizeCurrency, setPrizeCurrency] = useState('USD');
  const [prizeBreakdown, setPrizeBreakdown] = useState([
    { place: '1st Place', amount: 0 },
    { place: '2nd Place', amount: 0 },
    { place: '3rd Place', amount: 0 }
  ]);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const qc = useQueryClient();
  const { toasts, success: toastSuccess, error: toastError, info: toastInfo, removeToast } = useToast();

  // Fetch the manager's companies
  const myCompaniesQuery = useQuery({
    queryKey: ['myCompanies'],
    queryFn: fetchMyCompanies,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    onError: (err) => {
      if (err?.response?.status === 401) {
        toastError('You must be signed in as a company manager');
      } else if (err?.response?.status === 404) {
        toastError('No companies found. You must be a company owner to create tournaments.');
      } else {
        toastError(err?.response?.data?.message || err.message || 'Failed to load your companies');
      }
    }
  });

  const createMut = useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem('token');
      const res = await axios.post(TOURNAMENT_API, payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      toastSuccess('Tournament created');
      if (onCreated) onCreated(data);
    },
    onError: (err) => {
      toastError(err.response?.data?.message || err.message || 'Failed to create tournament');
    }
  });

  const companies = myCompaniesQuery.data?.companies || [];

  // Auto-select company if there's only one
  React.useEffect(() => {
    if (companies.length === 1 && !selectedCompany) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany]);

  const canSubmit = useMemo(() => name.trim().length >= 3 && maxTeams >= 2 && selectedCompany, [name, maxTeams, selectedCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return toastInfo('Please fill required fields and select a company', 4000);
    
    const payload = { 
      name: name.trim(), 
      sport,
      maxTeams, 
      poolCount,
      maxPlayersPerTeam,
      matchDurationMinutes,
      companyId: selectedCompany._id || selectedCompany.id,
      rules: {
        description: rulesDescription,
        allowOvertime,
        overtimeMinutes: allowOvertime ? overtimeMinutes : 0
      },
      prizePool: {
        total: totalPrizePool,
        currency: prizeCurrency,
        breakdown: prizeBreakdown.filter(p => p.amount > 0)
      }
    };
    
    await createMut.mutateAsync(payload);
    
    // Reset form
    setName(''); setSport('football'); setMaxTeams(8); setPoolCount(2);
    setMaxPlayersPerTeam(6); setMatchDurationMinutes(90); setSelectedCompany(null);
    setRulesDescription(''); setAllowOvertime(false); setOvertimeMinutes(15);
    setTotalPrizePool(0); setPrizeCurrency('USD');
    setPrizeBreakdown([{ place: '1st Place', amount: 0 }, { place: '2nd Place', amount: 0 }, { place: '3rd Place', amount: 0 }]);
    setShowAdvanced(false);
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 rounded-xl shadow-2xl border border-neutral-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Create Tournament</h3>
          <p className="text-sm text-slate-400 mt-1">Set up your tournament with custom rules and prizes</p>
        </div>
        <div className="text-xs text-slate-400 bg-neutral-800 px-3 py-1 rounded-full">Quick setup</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-600">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
            Basic Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Tournament Name</label>
              <input 
                aria-label="Tournament name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g., Summer Cup 2025" 
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all" 
              />
              <div className="text-xs text-slate-400 mt-1">Choose a memorable name (minimum 3 characters)</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sport</label>
              <select 
                value={sport} 
                onChange={e => setSport(e.target.value)}
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="football">Football ⚽</option>
                <option value="padel">Padel �</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Max Teams</label>
              <input 
                aria-label="Max teams" 
                type="number" 
                min={2} 
                max={64}
                value={maxTeams} 
                onChange={e => setMaxTeams(Number(e.target.value))} 
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Pool Count</label>
              <input 
                aria-label="Pool count" 
                type="number" 
                min={1} 
                max={8}
                value={poolCount} 
                onChange={e => setPoolCount(Number(e.target.value))} 
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Players per Team</label>
              <input 
                aria-label="Players per team" 
                type="number" 
                min={1} 
                max={15}
                value={maxPlayersPerTeam} 
                onChange={e => setMaxPlayersPerTeam(Number(e.target.value))} 
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500" 
              />
            </div>
          </div>
        </div>

        {/* Company Selection */}
        <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-600">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Company
          </h4>
          
          {myCompaniesQuery.isLoading ? (
            <div className="flex items-center gap-4 bg-neutral-900 px-4 py-3 rounded-lg">
              <div className="w-12 h-12 bg-neutral-700 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-neutral-700 rounded w-40 animate-pulse mb-2"></div>
                <div className="h-3 bg-neutral-700 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 px-4 py-3 rounded-lg">
              No companies found. Please ensure you're signed in as a company manager.
            </div>
          ) : companies.length === 1 ? (
            <div className="flex items-center gap-4 bg-neutral-900 px-4 py-3 rounded-lg border border-emerald-500/30">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-700 flex items-center justify-center">
                <img 
                  alt="company logo" 
                  src={getImageUrl(companies[0].logo || companies[0].logoUrl || '')} 
                  className="w-full h-full object-cover" 
                  onError={(e)=>{e.target.onerror=null; e.target.src='/placeholder-logo.png'}} 
                />
              </div>
              <div className="flex-1">
                <div className="text-base font-medium text-white">{companies[0].companyName || companies[0].name}</div>
                <div className="text-sm text-slate-400">{companies[0].address?.city || companies[0].domain || 'Your company'}</div>
              </div>
              <div className="text-sm text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded-full">✓ Auto-selected</div>
            </div>
          ) : (
            <div className="space-y-3">
              <select 
                value={selectedCompany?._id || selectedCompany?.id || ''} 
                onChange={(e) => {
                  const company = companies.find(c => (c._id || c.id) === e.target.value);
                  setSelectedCompany(company);
                }}
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select a company...</option>
                {companies.map(company => (
                  <option key={company._id || company.id} value={company._id || company.id}>
                    {company.companyName || company.name} {company.address?.city ? `(${company.address.city})` : ''}
                  </option>
                ))}
              </select>
              
              {selectedCompany && (
                <div className="flex items-center gap-4 bg-neutral-900 px-4 py-3 rounded-lg border border-sky-500/30">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-700 flex items-center justify-center">
                    <img 
                      alt="selected company logo" 
                      src={getImageUrl(selectedCompany.logo || selectedCompany.logoUrl || '')} 
                      className="w-full h-full object-cover" 
                      onError={(e)=>{e.target.onerror=null; e.target.src='/placeholder-logo.png'}} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{selectedCompany.companyName || selectedCompany.name}</div>
                    <div className="text-xs text-slate-400">{selectedCompany.address?.city || selectedCompany.domain || ''}</div>
                  </div>
                  <div className="text-xs text-sky-400 bg-sky-900/30 px-2 py-1 rounded-full">✓ Selected</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Match Configuration */}
        <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-600">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            Match Configuration
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Match Duration (minutes)</label>
              <input 
                type="number" 
                min={10} 
                max={180}
                value={matchDurationMinutes} 
                onChange={e => setMatchDurationMinutes(Number(e.target.value))}
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500" 
              />
              <div className="text-xs text-slate-400 mt-1">Standard match length</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center gap-2">
                  Allow Overtime
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={allowOvertime} 
                      onChange={e => setAllowOvertime(e.target.checked)}
                      className="sr-only"
                    />
                    <div 
                      onClick={() => setAllowOvertime(!allowOvertime)}
                      className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${
                        allowOvertime ? 'bg-sky-500' : 'bg-neutral-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ${
                        allowOvertime ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </label>
              
              {allowOvertime && (
                <div className="mt-3">
                  <label className="block text-xs text-slate-400 mb-1">Overtime Duration (minutes)</label>
                  <input 
                    type="number" 
                    min={5} 
                    max={30}
                    value={overtimeMinutes} 
                    onChange={e => setOvertimeMinutes(Number(e.target.value))}
                    className="w-full bg-neutral-900 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:ring-1 focus:ring-sky-500" 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rules Configuration */}
        <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-600">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Tournament Rules
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Rules Description</label>
              <textarea 
                value={rulesDescription} 
                onChange={e => setRulesDescription(e.target.value)}
                placeholder="Describe the tournament rules, format, and special conditions..."
                rows={3}
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" 
              />
              <div className="text-xs text-slate-400 mt-1">Explain the tournament format and any special rules</div>
            </div>
          </div>
        </div>

        {/* Prize Pool Configuration */}
        <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-600">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Prize Pool
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Prize Pool</label>
                <input 
                  type="number" 
                  min={0} 
                  step={0.01}
                  value={totalPrizePool} 
                  onChange={e => setTotalPrizePool(Number(e.target.value))}
                  className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
                <select 
                  value={prizeCurrency} 
                  onChange={e => setPrizeCurrency(e.target.value)}
                  className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="TND">TND (د.ت)</option>
                  <option value="MAD">MAD (DH)</option>
                </select>
              </div>
            </div>

            {totalPrizePool > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Prize Distribution</label>
                <div className="space-y-3">
                  {prizeBreakdown.map((prize, index) => (
                    <div key={index} className="flex items-center gap-4 bg-neutral-900 p-3 rounded-lg border border-neutral-600">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <input 
                          type="text"
                          placeholder={index === 0 ? "1st Place" : index === 1 ? "2nd Place" : index === 2 ? "3rd Place" : `${index + 1}th Place`}
                          value={prize.place} 
                          onChange={e => {
                            const newBreakdown = [...prizeBreakdown];
                            newBreakdown[index].place = e.target.value;
                            setPrizeBreakdown(newBreakdown);
                          }}
                          className="w-full bg-neutral-800 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:ring-1 focus:ring-sky-500" 
                        />
                      </div>
                      
                      <div className="w-24">
                        <input 
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="Amount"
                          value={prize.amount} 
                          onChange={e => {
                            const newBreakdown = [...prizeBreakdown];
                            newBreakdown[index].amount = Number(e.target.value);
                            setPrizeBreakdown(newBreakdown);
                          }}
                          className="w-full bg-neutral-800 text-white px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:ring-1 focus:ring-sky-500" 
                        />
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => {
                          const newBreakdown = prizeBreakdown.filter((_, i) => i !== index);
                          setPrizeBreakdown(newBreakdown);
                        }}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/20 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    onClick={() => setPrizeBreakdown([...prizeBreakdown, { place: `${prizeBreakdown.length + 1}th Place`, amount: 0 }])}
                    className="w-full bg-neutral-900 border-2 border-dashed border-neutral-600 text-slate-400 py-3 rounded-lg hover:border-sky-500 hover:text-sky-400 transition-colors"
                  >
                    + Add Prize Position
                  </button>
                </div>
                
                <div className="mt-3 text-sm text-slate-400">
                  Total allocated: {prizeCurrency} {prizeBreakdown.reduce((sum, prize) => sum + (prize.amount || 0), 0).toFixed(2)} 
                  {totalPrizePool > 0 && (
                    <span className={prizeBreakdown.reduce((sum, prize) => sum + (prize.amount || 0), 0) > totalPrizePool ? " text-red-400" : " text-green-400"}>
                      {" "}({((prizeBreakdown.reduce((sum, prize) => sum + (prize.amount || 0), 0) / totalPrizePool) * 100).toFixed(1)}% of total)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-neutral-600">
          <button 
            type="button" 
            onClick={() => {
              // Reset form
              setName(''); setSport('football'); setMaxTeams(8); setPoolCount(2);
              setMaxPlayersPerTeam(6); setMatchDurationMinutes(90); setSelectedCompany(null);
              setRulesDescription(''); setAllowOvertime(false); setOvertimeMinutes(15);
              setTotalPrizePool(0); setPrizeCurrency('USD');
              setPrizeBreakdown([{ place: '1st Place', amount: 0 }, { place: '2nd Place', amount: 0 }, { place: '3rd Place', amount: 0 }]);
            }}
            className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-3 px-4 rounded-lg transition-colors border border-neutral-600"
          >
            Reset Form
          </button>
          <button 
            type="submit" 
            disabled={!canSubmit || createMut.isLoading || myCompaniesQuery.isLoading}
            className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:from-neutral-600 disabled:to-neutral-700 text-white py-3 px-4 rounded-lg transition-all font-medium shadow-lg disabled:shadow-none"
          >
            {createMut.isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </div>
            ) : (
              'Create Tournament'
            )}
          </button>
        </div>
      </form>

      <div className="mt-3">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
}
