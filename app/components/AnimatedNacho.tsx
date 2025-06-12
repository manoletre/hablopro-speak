'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface AnimatedNachoProps {
  isSpeaking: boolean;
  size?: 'sm' | 'md' | 'lg';
  level?: number;
}

export default function AnimatedNacho({ isSpeaking, size = 'md', level = 3 }: AnimatedNachoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Size mapping
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48'
  };
  
  // Image mapping based on level
  const getNachoImage = () => {
    switch (level) {
      case 1:
        return "/images/nacho_level1.png";
      case 2:
        return "/images/nacho_level2.png";
      case 3:
        return "/images/nacho_transparent.png";
      case 4:
        return "/images/nacho_level4.png";
      case 5:
        return "/images/nacho_level5.png";
      default:
        return "/images/nacho_transparent.png";
    }
  };
  
  // Effect to handle the beating animation when AI is speaking
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    let animationFrame: number;
    let scale = 1;
    let growing = true;
    const minScale = 1;
    const maxScale = 1.05;
    const animationSpeed = 0.002; // Adjust for faster/slower animation
    
    const animate = () => {
      if (!isSpeaking) {
        // If not speaking, smoothly return to normal size
        if (Math.abs(scale - 1) > 0.001) {
          scale = scale + (1 - scale) * 0.1;
          container.style.transform = `scale(${scale})`;
          animationFrame = requestAnimationFrame(animate);
        } else {
          container.style.transform = 'scale(1)';
        }
        return;
      }
      
      // Calculate new scale
      if (growing) {
        scale += animationSpeed;
        if (scale >= maxScale) {
          growing = false;
        }
      } else {
        scale -= animationSpeed;
        if (scale <= minScale) {
          growing = true;
        }
      }
      
      // Apply scale transformation
      container.style.transform = `scale(${scale})`;
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    // Cleanup animation on unmount
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isSpeaking]);
  
  return (
    <div 
      ref={containerRef}
      className={`relative ${sizeClasses[size]} transition-transform duration-100`}
    >
      <Image
        src={getNachoImage()}
        alt="Nacho the sloth"
        fill
        sizes={
          size === 'sm'
            ? '96px'
            : size === 'lg'
            ? '192px'
            : '144px' // default for 'md'
        }
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
} 