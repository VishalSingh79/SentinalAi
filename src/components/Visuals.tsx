import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/Web_Page_Background.mp4" type="video/mp4" />
      </video>
      
      {/* Subtle overlay to ensure UI elements remain readable against the video */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
    </div>
  );
};