import React, { forwardRef } from 'react';

export const Card = forwardRef(({ children, className = "", variant = "default", accent = false, as: Component = 'div', ...props }, ref) => {
  const variants = {
    default: "bg-slate-800 text-slate-300 border border-slate-700 shadow-lg",
    glass: "bg-slate-800/80 backdrop-blur-lg border border-blue-500/30 shadow-xl",
    elevated: "bg-slate-800 text-slate-300 border border-blue-500 shadow-xl transform hover:scale-[1.01] transition-transform duration-300",
    interactive: "bg-slate-800 text-slate-300 border border-blue-500 shadow-md hover:shadow-lg hover:border-blue-400 transition-all duration-300 cursor-pointer"
  };
  const accentBorder = accent ? "border-2 border-blue-500" : "";
  return (
    <Component 
      ref={ref}
      className={`rounded-xl overflow-hidden ${variants[variant]} ${accentBorder} ${className}`}
      {...props}
    >
      <div className="relative z-10 p-6">
        {children}
      </div>
    </Component>
  )
})

// Add display name for better debugging
Card.displayName = 'Card';
