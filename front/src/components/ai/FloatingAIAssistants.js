import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, X, Zap, Brain, MessageCircle } from 'lucide-react';
import './FloatingAIAssistants.css';

const FloatingAIAssistants = () => {
  const [userRole, setUserRole] = useState(null);

  // Get user role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log("🔍 FloatingAI Debug - storedUser:", storedUser);
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log("🔍 FloatingAI Debug - userData:", userData);
        console.log("🔍 FloatingAI Debug - userRole:", userData.role);
        setUserRole(userData.role);
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  console.log("🔍 FloatingAI Debug - Current userRole state:", userRole);

  // Temporarily show for any connected user for testing
  if (!userRole) {
    console.log("🔍 FloatingAI Debug - Not showing because no userRole");
    return null;
  }

  console.log("🔍 FloatingAI Debug - Showing AI assistants for user with role:", userRole);

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-4">
      {/* Bouton simple Sportify AI */}
      <button
        onClick={() => window.open('http://localhost:8503/', '_blank')}
        className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-300"
      >
        <Sparkles className="w-6 h-6" />
      </button>
      
      {/* Bouton simple Assistant AI */}
      <button
        onClick={() => window.open('http://localhost:8502/', '_blank')}
        className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-300"
      >
        <Bot className="w-6 h-6" />
      </button>
    </div>
  );
};

export default FloatingAIAssistants;