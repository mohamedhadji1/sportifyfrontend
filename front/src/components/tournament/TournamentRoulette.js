import { useState, useEffect } from "react"
import { useAuth } from "../../hooks/useAuth"

// Perfect Roulette CSS - Exact Style Match
const rouletteStyles = `
  @keyframes rouletteSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  
  @keyframes bounceArrow {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(5px); }
  }
  
  .roulette-wheel {
    position: relative;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    overflow: hidden;
    border: 8px solid #2c3e50;
    box-shadow: 
      0 0 0 4px #34495e,
      0 20px 40px rgba(0,0,0,0.3),
      inset 0 0 0 2px rgba(255,255,255,0.1);
  }
  
  .center-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: #c0392b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 12px;
    z-index: 10;
    border: 3px solid #2c3e50;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }
  
  .roulette-arrow {
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-bottom: 25px solid #e74c3c;
    z-index: 20;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    animation: bounceArrow 2s infinite ease-in-out;
  }
`;

const TournamentRoulette = ({ tournament, onDrawCompleted }) => {
  // Always get token from localStorage for API requests
  const { token: contextToken } = useAuth()
  const token = contextToken || localStorage.getItem('token') || localStorage.getItem('authToken') || ''
  const [selectedTeams, setSelectedTeams] = useState([])
  const [spinAngle, setSpinAngle] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [remainingTeams, setRemainingTeams] = useState([])
  const [drawProgress, setDrawProgress] = useState("")
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (tournament && tournament.teams) {
      setRemainingTeams([...tournament.teams])
      setSelectedTeams([]) // Reset selected teams when tournament changes
      setSpinAngle(0) // Reset rotation
      setDrawProgress(`Ready to draw! ${tournament.teams.length} teams waiting`)
    }
  }, [tournament])

  const getSegmentColor = (index) => {
    const colors = [
      "#E74C3C", "#3498DB", "#2ECC71", "#F39C12", 
      "#9B59B6", "#1ABC9C", "#E67E22", "#34495E"
    ]
    return colors[index % colors.length]
  }

  const segments = remainingTeams.map((team, index) => ({
    team,
    color: getSegmentColor(index),
  }))

  // Debug: Log segment positions when teams change
  useEffect(() => {
    if (remainingTeams.length > 0) {
      console.log("=== SEGMENT LAYOUT ===")
      remainingTeams.forEach((team, idx) => {
        const segmentAngle = 360 / remainingTeams.length
        const centerAngle = idx * segmentAngle + (segmentAngle / 2)
        console.log(`Segment ${idx}: ${team.name} - center at ${centerAngle}°`)
      })
      console.log("Pointer is at BOTTOM = should align with 90° after accounting for -90° SVG rotation")
      console.log("=====================")
    }
  }, [remainingTeams])

  const spinRoulette = () => {
    if (isSpinning || remainingTeams.length === 0) return

    setIsSpinning(true)
    
    // Random spins between 5-8 full rotations
    const minSpins = 5
    const maxSpins = 8
    const spins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins
    
    // Calculate segment angle
    const segmentAngle = 360 / remainingTeams.length
    
    // Pick a random team to land on
    const selectedIndex = Math.floor(Math.random() * remainingTeams.length)
    
    console.log("=== ROULETTE SPIN DEBUG ===")
    console.log("Selected team index:", selectedIndex)
    console.log("Selected team:", remainingTeams[selectedIndex].name)
    console.log("Number of segments:", remainingTeams.length)
    console.log("Segment angle:", segmentAngle)
    console.log("Current spin angle:", spinAngle)
    
    // The wheel rotates, pointer stays fixed at bottom
    // SVG paths are drawn with (angle - 90), rotating the coordinate system
    // But when we apply transform: rotate() to the wheel container, 
    // it rotates in standard coordinates where:
    // - 0° is at the RIGHT (3 o'clock)
    // - 90° is at the BOTTOM (6 o'clock) 
    // - 180° is at the LEFT (9 o'clock)
    // - 270° is at the TOP (12 o'clock)
    // 
    // However, the segments themselves are laid out starting from:
    // - Segment 0 at 0° + offset
    // Looking at the screenshot, Barcelona at 180° is at the bottom pointer
    // So the pointer is at 180° in our segment coordinate system!
    
    // Where this segment naturally sits (its center)
    const segmentNaturalPosition = selectedIndex * segmentAngle + (segmentAngle / 2)
    console.log("Segment natural center position:", segmentNaturalPosition)
    
    // Pointer is at 180 degrees in our coordinate system
    // We want to rotate the wheel so this segment's center lands at 180 degrees
    let rotationToAlign = 180 - segmentNaturalPosition
    
    // Make sure rotation is always positive (clockwise) for visual effect
    while (rotationToAlign < 0) {
      rotationToAlign += 360
    }
    
    console.log("Rotation needed to align to 180° (bottom pointer):", rotationToAlign)
    
    // Add full spins
    const totalRotation = (spins * 360) + rotationToAlign
    console.log("Total rotation (with spins):", totalRotation)
    
    // Final angle is cumulative
    const finalAngle = spinAngle + totalRotation
    console.log("Final angle:", finalAngle)
    console.log("After rotation, segment will be at:", (segmentNaturalPosition + totalRotation) % 360, "degrees")
    console.log("========================")
    
    setSpinAngle(finalAngle)
    setDrawProgress("🎯 Selection in progress...")

    setTimeout(() => {
      setIsSpinning(false)
      const selectedTeam = remainingTeams[selectedIndex]
      
      // Add selected team to the list
      const updatedSelectedTeams = [...selectedTeams, selectedTeam];
      setSelectedTeams(updatedSelectedTeams)
      
      // Remove selected team from remaining
      const newRemainingTeams = remainingTeams.filter((_, index) => index !== selectedIndex)
      setRemainingTeams(newRemainingTeams)
      
      // CRITICAL: Reset wheel rotation to 0 so new segment layout matches visual position
      // When we remove a team, segments are recalculated with new positions
      // We need to reset the wheel so the new layout starts from the correct position
      setSpinAngle(0)

      setTimeout(() => {
        if (newRemainingTeams.length === 0) {
          // Last team selected, complete the draw with the updated teams list
          completeDrawProcess(updatedSelectedTeams)
        } else {
          setDrawProgress(`🎉 ${selectedTeam.name} selected! ${newRemainingTeams.length} teams remaining`)
        }
      }, 500)
    }, 4000) // 4 seconds spin duration for better effect
  }

  const updateTournament = async (patch) => {
    try {
      console.log('Updating tournament with token:', token ? 'Present' : 'Missing');
      console.log('Tournament ID:', tournament._id);
      console.log('Patch:', patch);

      const response = await fetch(`http://localhost:5006/api/tournaments/${tournament._id}`, {
        method: "PUT",
        headers: {
          "x-auth-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      })
      
      const responseData = await response.json();
      console.log('API Response:', response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to update tournament")
      }
      return responseData
    } catch (err) {
      console.error("Tournament update error:", err)
      throw err
    }
  }

  const completeDrawProcess = async (finalTeams = selectedTeams) => {
    setDrawProgress("🎉 Finalizing the draw...");
    setShowConfetti(true);

    console.log('📋 Completing draw with teams:', finalTeams);
    console.log('📋 Type of finalTeams:', typeof finalTeams);
    console.log('📋 Is array?:', Array.isArray(finalTeams));
    console.log('📋 Length:', finalTeams?.length);

    if (!Array.isArray(finalTeams) || finalTeams.length !== 8) {
      console.error('❌ Invalid teams data for draw:', finalTeams);
      setDrawProgress(`⚠️ Error: Need exactly 8 teams, got ${Array.isArray(finalTeams) ? finalTeams.length : typeof finalTeams}`);
      return;
    }

    // Always try to update tournament with selected teams after draw
    const patch = {
      teams: finalTeams,
      teamOrder: finalTeams.map(team => team.name),
      drawCompleted: true,
      drawDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stage: 'knockout'
    };

    // Note: companyId will be automatically derived by the backend middleware from the tournament

    try {
      // First, try to update tournament via API
      await updateTournament(patch);
      setDrawProgress("✅ Draw completed!");
      setTimeout(() => {
        onDrawCompleted({ ...tournament, ...patch });
      }, 2000);
    } catch (err) {
      // If API fails, fallback to local update
      setDrawProgress("⚠️ API update failed, using local data");
      console.error("API update failed, continuing with local data", err);
      setTimeout(() => {
        onDrawCompleted({ ...tournament, ...patch });
      }, 2000);
    }
  }

  return (
    <>
      <style>{rouletteStyles}</style>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black py-12 px-2 sm:px-8 overflow-x-hidden">
                {/* Confetti Animation */}
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none z-50">
                    {[...Array(80)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          width: `${4 + Math.random() * 8}px`,
                          height: `${4 + Math.random() * 8}px`,
                          backgroundColor: getSegmentColor(i % 12),
                          animationDelay: `${Math.random() * 3}s`,
                          animationDuration: `${1 + Math.random() * 3}s`,
                          boxShadow: "0 0 10px rgba(255,255,255,0.5)",
                        }}
                      />
                    ))}
                  </div>
                )}
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute top-32 right-20 w-16 h-16 bg-pink-400 rounded-full opacity-20 animate-bounce"></div>
                  <div
                    className="absolute bottom-20 left-32 w-24 h-24 bg-green-400 rounded-full opacity-20 animate-pulse"
                    style={{ animationDelay: "1s" }}
                  ></div>
                  <div
                    className="absolute bottom-40 right-10 w-18 h-18 bg-blue-400 rounded-full opacity-20 animate-bounce"
                    style={{ animationDelay: "2s" }}
                  ></div>
                </div>
                <div className="max-w-6xl mx-auto text-center relative z-20">
                  {/* Enhanced Header */}
                  <div className="mb-12">
                    <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl">
                      🎯{" "}
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        MAGIC ROULETTE
                      </span>
                    </h2>
                    <p className="text-xl text-blue-200 mb-6 drop-shadow-lg">
                      Spectacular draw for your tournament
                    </p>
                    <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
                  </div>
                  {/* Enhanced Progress */}
                  <div className="mb-12 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
                    <p className="text-white font-bold text-lg">{drawProgress}</p>
                    {remainingTeams.length > 0 && (
                      <div className="mt-4 w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              (((tournament?.teams?.length || 8) -
                                remainingTeams.length) /
                                (tournament?.teams?.length || 8)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                  {/* Perfect Roulette Container - Exact Match */}
                  <div className="relative mb-8 sm:mb-12 flex justify-center items-center">
                    <div className="relative">
                      <div className="roulette-arrow"></div>
                      <div
                        className="roulette-wheel cursor-pointer"
                        style={{
                          transform: `rotate(${spinAngle}deg)`,
                          transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                        }}
                        onClick={spinRoulette}
                      >
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 300 300"
                          className="absolute inset-0"
                          style={{ minWidth: "220px", minHeight: "220px", maxWidth: "340px", maxHeight: "340px" }}
                        >
                          {segments.map((segment, index) => {
                            const { team, color } = segment;
                            const segmentAngle = 360 / segments.length;
                            const startAngle = index * segmentAngle;
                            const endAngle = (index + 1) * segmentAngle;
                            const midAngle = startAngle + segmentAngle / 2;
                            const startRad = ((startAngle - 90) * Math.PI) / 180;
                            const endRad = ((endAngle - 90) * Math.PI) / 180;
                            const midRad = ((midAngle - 90) * Math.PI) / 180;
                            const x1 = 150 + 142 * Math.cos(startRad);
                            const y1 = 150 + 142 * Math.sin(startRad);
                            const x2 = 150 + 142 * Math.cos(endRad);
                            const y2 = 150 + 142 * Math.sin(endRad);
                            // Team name position (midpoint of arc)
                            const textRadius = 110;
                            const textX = 150 + textRadius * Math.cos(midRad);
                            const textY = 150 + textRadius * Math.sin(midRad);
                            const textAngle = midAngle;
                            return (
                              <g key={index}>
                                <path
                                  d={`M150,150 L${x1},${y1} A142,142 0 0,1 ${x2},${y2} Z`}
                                  fill={color}
                                  stroke="#222"
                                  strokeWidth={2}
                                />
                                <text
                                  x={textX}
                                  y={textY}
                                  fontSize={segments.length > 8 ? 10 : 13}
                                  fontWeight="bold"
                                  fill="white"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                                  style={{
                                    textShadow: "2px 2px 4px rgba(0,0,0,0.9)",
                                    filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.9))",
                                    pointerEvents: "none"
                                  }}
                                >
                                  {team.name && (team.name.length > 10 ? team.name.substring(0, 10) + "..." : team.name)}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                        {/* Center circle */}
                        <div className="center-circle flex flex-col items-center justify-center">
                          <span className="text-white text-lg font-bold">DRAW</span>
                          <span className="text-xs text-white/80">Click to spin</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Team Selection Progress & Finalize Button */}
                  <div className="mt-8 flex flex-col items-center">
                    {remainingTeams.length > 0 && (
                      <button
                        onClick={spinRoulette}
                        className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-full hover:from-yellow-600 hover:to-orange-700 transform hover:scale-110 transition-all duration-300 shadow-2xl mb-4"
                      >
                        <span className="relative flex items-center text-xl">
                          🎲 SPIN ROULETTE
                        </span>
                      </button>
                    )}
                    {remainingTeams.length === 0 && selectedTeams.length > 0 && (
                      <button
                        onClick={() => completeDrawProcess(selectedTeams)}
                        className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold rounded-full hover:from-green-600 hover:to-blue-700 transform hover:scale-110 transition-all duration-300 shadow-2xl"
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-500 to-blue-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></span>
                        <span className="relative flex items-center text-xl">
                          ✨ FINALIZE DRAW
                        </span>
                      </button>
                    )}
                  </div>
                  {/* Enhanced Tournament Info */}
                  {tournament && (
                    <div className="mt-8 p-6 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                      <div className="flex items-center justify-center text-white">
                        <span className="text-2xl mr-3">🏟️</span>
                        <span className="text-lg font-bold drop-shadow-md">
                          {tournament.name}
                        </span>
                        <span className="text-2xl ml-3">⚽</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
}

export default TournamentRoulette