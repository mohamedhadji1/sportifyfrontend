import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../shared/ui/components/Card';

const TournamentCreation = ({ availableTeams, onTournamentCreated, loading }) => {
  let { token, user } = useAuth()
  if (!token) {
    token = localStorage.getItem("token")
  }
  const [formData, setFormData] = useState({
    name: "",
    sport: "Paddle",
    selectedCourt: "",
    selectedTeams: [],
  })
  const [creating, setCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [availableCourts, setAvailableCourts] = useState([])
  const [loadingCourts, setLoadingCourts] = useState(true)

  console.log("TournamentCreation - availableTeams:", availableTeams)
  console.log("TournamentCreation - availableTeams type:", typeof availableTeams)
  console.log("TournamentCreation - is array:", Array.isArray(availableTeams))
  console.log("TournamentCreation - loading:", loading)

  const fetchManagerCourts = useCallback(async () => {
    setLoadingCourts(true)
    try {
      let courtsUrl = "https://sportify-courts.onrender.com/api/courts"
      if (user?.companyId) {
        courtsUrl = `https://sportify-courts.onrender.com/api/courts/company/${user.companyId}`
      }
      const response = await fetch(courtsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        const courts = Array.isArray(data) ? data : data.courts || []
        setAvailableCourts(courts)
        console.log("Available courts:", courts)
      } else {
        console.warn("Failed to fetch courts:", response.status)
        setAvailableCourts([])
      }
    } catch (error) {
      console.error("Error fetching courts:", error)
      setAvailableCourts([])
    } finally {
      setLoadingCourts(false)
    }
  }, [token, user])

  useEffect(() => {
    fetchManagerCourts()
  }, [fetchManagerCourts])

  const filteredTeams = (Array.isArray(availableTeams) ? availableTeams : []).filter((team) => {
    const matchesSport = team?.sport?.toLowerCase() === formData.sport.toLowerCase()
    const matchesSearch = team?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSport && matchesSearch
  })

  const handleTeamToggle = (team) => {
    setFormData((prev) => {
      const isSelected = prev.selectedTeams.some((t) => t._id === team._id)
      if (isSelected) {
        return {
          ...prev,
          selectedTeams: prev.selectedTeams.filter((t) => t._id !== team._id),
        }
      } else if (prev.selectedTeams.length < 8) {
        return {
          ...prev,
          selectedTeams: [...prev.selectedTeams, team],
        }
      }
      return prev
    })
  }

  const handleSubmit = async (e) => {
    console.log("JWT token used for tournament creation:", token)
    e.preventDefault()

    if (formData.selectedTeams.length !== 8) {
      alert("You must select exactly 8 teams")
      return
    }

    if (!formData.selectedCourt) {
      alert("You must select a court")
      return
    }

    setCreating(true)
    try {
      const headers = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
      const response = await fetch("https://service-tournament.onrender.com/api/tournaments/knockout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: formData.name,
          sport: formData.sport,
          courtId: formData.selectedCourt,
          teamIds: formData.selectedTeams.map((team) => team._id),
        }),
      })

      if (response.ok) {
        const tournament = await response.json()
        onTournamentCreated(tournament)
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error("Error creating tournament:", error)
      alert("Error while creating the tournament")
    } finally {
      setCreating(false)
    }
  }

  const sportIcons = {
    Football: "⚽",
    Basketball: "🏀",
    Tennis: "🎾",
    Paddle: "🏓",
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-block">
            <div className="text-6xl mb-4">🏆</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tight">CREATE TOURNAMENT</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Build your 8-team knockout competition
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-px w-12 bg-border"></div>
            <span className="uppercase tracking-wider font-semibold">Setup & Configure</span>
            <div className="h-px w-12 bg-border"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Configuration Card */}
          <Card className="bg-card border-border p-8 shadow-xl">
            <div className="space-y-8">
              {/* Tournament Name */}
              <div className="space-y-3">
                <label className="block text-sm font-bold uppercase tracking-wider text-foreground">
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-background border-2 border-border rounded-lg px-6 py-4 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                  placeholder="Enter tournament name"
                  required
                />
              </div>

              {/* Sport & Court Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Sport Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold uppercase tracking-wider text-foreground">Sport</label>
                  <div className="relative">
                    <select
                      value={formData.sport}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          sport: e.target.value,
                          selectedTeams: [],
                        }))
                      }
                      className="w-full bg-background border-2 border-border rounded-lg px-6 py-4 text-lg font-semibold text-foreground appearance-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="Football">⚽ Football</option>
                      <option value="Basketball">🏀 Basketball</option>
                      <option value="Tennis">🎾 Tennis</option>
                      <option value="Paddle">🏓 Paddle</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Court Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold uppercase tracking-wider text-foreground">Venue</label>
                  {loadingCourts ? (
                    <div className="w-full bg-background border-2 border-border rounded-lg px-6 py-4 text-muted-foreground flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                      <span className="font-medium">Loading venues...</span>
                    </div>
                  ) : availableCourts.length > 0 ? (
                    <div className="relative">
                      <select
                        value={formData.selectedCourt}
                        onChange={(e) => setFormData((prev) => ({ ...prev, selectedCourt: e.target.value }))}
                        className="w-full bg-background border-2 border-border rounded-lg px-6 py-4 text-lg font-semibold text-foreground appearance-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all cursor-pointer"
                        required
                      >
                        <option value="">Select venue</option>
                        {availableCourts.map((court) => (
                          <option key={court._id} value={court._id}>
                            {court.name} -{" "}
                            {typeof court.location === "object"
                              ? `${court.location.address || ""} ${court.location.city || ""}`.trim() ||
                                "Location not specified"
                              : court.location || "Location not specified"}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-destructive/10 border-2 border-destructive/20 rounded-lg px-6 py-4 text-destructive font-medium">
                      No venues available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Team Selection Card */}
          <Card className="bg-card border-border p-8 shadow-xl">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Select Teams</h2>
                  <p className="text-muted-foreground mt-1 font-medium">Choose exactly 8 teams for the tournament</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-primary">{formData.selectedTeams.length}/8</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Teams</div>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-background border-2 border-border rounded-lg pl-12 pr-6 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                  placeholder="Search teams..."
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Selected Teams */}
              {formData.selectedTeams.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Selected Teams</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.selectedTeams.map((team) => (
                      <div
                        key={team._id}
                        className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4 flex items-center gap-3 group hover:border-primary/50 transition-all"
                      >
                        {team.logo && (
                          <img
                            src={team.logo || "/placeholder.svg"}
                            alt={team.name}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-primary/20"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-foreground truncate">{team.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {team.currentMembers || team.members?.length || 0} members
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTeamToggle(team)}
                          className="w-8 h-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-all font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Teams */}
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Available Teams</div>
                <div className="border-2 border-border bg-background rounded-lg max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                      <div className="text-muted-foreground font-semibold">Loading teams...</div>
                    </div>
                  ) : !Array.isArray(availableTeams) || availableTeams.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-6xl mb-4">🔍</div>
                      <div className="text-xl font-bold text-foreground mb-2">No teams available</div>
                      <div className="text-muted-foreground">Make sure the team service is running</div>
                    </div>
                  ) : filteredTeams.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-6xl mb-4">{sportIcons[formData.sport] || "🏆"}</div>
                      <div className="text-xl font-bold text-foreground mb-2">
                        {searchTerm ? "No teams found" : `No ${formData.sport} teams available`}
                      </div>
                      <div className="text-muted-foreground">
                        {searchTerm ? "Try another search term" : "Try selecting a different sport"}
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredTeams.map((team) => {
                        const isSelected = formData.selectedTeams.some((t) => t._id === team._id)
                        const canSelect = !isSelected && formData.selectedTeams.length < 8
                        return (
                          <div
                            key={team._id}
                            className={`p-5 flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary/5 border-l-4 border-l-primary"
                                : canSelect
                                  ? "hover:bg-accent/50"
                                  : "opacity-40 cursor-not-allowed"
                            }`}
                            onClick={() => (isSelected || canSelect) && handleTeamToggle(team)}
                          >
                            <div className="flex items-center gap-4">
                              {team.logo && (
                                <img
                                  src={team.logo || "/placeholder.svg"}
                                  alt={team.name}
                                  className="w-14 h-14 rounded-lg object-cover border-2 border-border"
                                />
                              )}
                              <div>
                                <div className="font-bold text-lg text-foreground">{team.name}</div>
                                <div className="text-sm text-muted-foreground font-medium">
                                  {team.sport} • {team.currentMembers || team.members?.length || 0} members
                                </div>
                              </div>
                            </div>
                            <div>
                              {isSelected ? (
                                <div className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold uppercase tracking-wider">
                                  Selected
                                </div>
                              ) : canSelect ? (
                                <div className="px-4 py-2 bg-accent text-accent-foreground rounded-full text-sm font-bold uppercase tracking-wider">
                                  Select
                                </div>
                              ) : (
                                <div className="px-4 py-2 bg-muted text-muted-foreground rounded-full text-sm font-bold uppercase tracking-wider">
                                  Full
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={
                creating || formData.selectedTeams.length !== 8 || !formData.name.trim() || !formData.selectedCourt
              }
              className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-12 py-5 rounded-lg font-black text-xl uppercase tracking-wider transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 disabled:shadow-none flex items-center gap-3"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-primary-foreground border-t-transparent"></div>
                  Creating Tournament...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Create Tournament
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TournamentCreation
