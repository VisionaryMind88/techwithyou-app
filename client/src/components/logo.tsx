import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "normal" | "inverted";
  textColor?: string;
}

export function Logo({ 
  className = "", 
  size = "md", 
  variant = "normal",
  textColor
}: LogoProps) {
  // Size mapping
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };
  
  // Color mapping
  const colorClasses = {
    normal: "text-[#4aaee8]", // The blue color from the logo
    inverted: "text-white",
  };
  
  return (
    <div className={`font-bold ${sizeClasses[size]} ${textColor || colorClasses[variant]} ${className}`}>
      TechWithYou
    </div>
  );
}