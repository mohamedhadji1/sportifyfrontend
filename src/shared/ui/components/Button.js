import React from 'react';

export const Button = ({ 
  children, 
  variant = "primary", 
  className = "", 
  name = "",
  loading,
  disabled,
  ...props 
}) => {
  // Filtrer les props qui ne doivent pas être passées au DOM
  const { onClick, type, ...domProps } = props;
  const baseClasses =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"

  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 focus-visible:ring-blue-500 shadow-lg px-5 py-2 text-base font-semibold",
    secondary: "bg-slate-700 text-slate-300 px-5 py-2 rounded-lg hover:bg-slate-600 transition-colors",
    outline: "border border-blue-500 text-blue-500 px-5 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors",
    ghost: "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
    success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    glass:
      "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 focus-visible:ring-white/30 shadow-lg",
  }

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`} 
      name={name} 
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...domProps}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}
