import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "normal" | "inverted";
}

export function Logo({ 
  className = "", 
  size = "md", 
  variant = "normal" 
}: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-32",
    md: "h-10 w-36", 
    lg: "h-12 w-40"
  };

  const colorClasses = {
    normal: "bg-white text-primary-800",
    inverted: "bg-primary-800 text-white"
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${colorClasses[variant]} rounded-md flex items-center justify-center font-bold ${className}`}
    >
      COMPANY LOGO
    </div>
  );
}
