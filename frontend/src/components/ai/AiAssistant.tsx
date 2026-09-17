import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { AiChatWindow } from './AiChatWindow.js';
import { PageContext } from './ai.types.js';

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Derive current page context safely from location pathname
  const pageContext: PageContext = useMemo(() => {
    const path = location.pathname;
    let page = 'Home';
    let venueId: string | undefined;
    let matchId: string | undefined;
    let sport: string | undefined = 'Cricket';

    if (path.startsWith('/venues/')) {
      venueId = path.split('/venues/')[1];
      if (venueId?.includes('rrr')) {
        page = 'RRR Cricket Club';
      } else if (venueId?.includes('playnow')) {
        page = 'Playnow Cricket Ground';
      } else if (venueId?.includes('ab-cricket')) {
        page = 'AB Cricket Ground';
      } else {
        page = 'Venue Details';
      }
    } else if (path === '/venues') {
      page = 'Venues Catalog';
    } else if (path === '/live-matches') {
      page = 'Live Matches';
    } else if (path.startsWith('/store')) {
      page = 'BE11 Store';
    } else if (path === '/jersey-builder') {
      page = '3D Jersey Builder';
    } else if (path === '/kit-builder') {
      page = 'Cricket Kit Builder';
    } else if (path === '/toss') {
      page = '3D Toss';
    } else if (path === '/capture') {
      page = 'BE11 Capture';
    } else if (path === '/coaches' || path.startsWith('/coaches/')) {
      page = 'Coaches';
    } else if (path === '/tournaments') {
      page = 'Tournaments';
    } else if (path === '/my-bookings') {
      page = 'My Bookings';
    } else if (path === '/profile' || path === '/settings') {
      page = 'Profile Settings';
    } else if (path === '/admin' || path.startsWith('/admin/')) {
      page = 'Admin Portal';
    }

    return {
      route: path,
      page,
      venueId,
      matchId,
      sport,
    };
  }, [location.pathname]);

  return (
    <>
      {/* Floating Action Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center group">
        {/* Tooltip (Only visible on hover when closed on desktop) */}
        {!isOpen && (
          <div className="hidden sm:block absolute right-16 px-3 py-1.5 rounded-xl bg-[#001a49] text-white text-xs font-semibold whitespace-nowrap shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mr-2">
            Ask BE11 AI
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-[#001a49] rotate-45 border-t border-r border-white/10" />
          </div>
        )}

        {/* The Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(0,26,73,0.3)] transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#FF8C1A]/40 ${
            isOpen
              ? 'bg-[#001a49] text-white rotate-90 border border-white/20'
              : 'bg-gradient-to-tr from-[#001a49] via-[#0a2e6e] to-[#FF8C1A] text-white border border-[#FF8C1A]/50 hover:shadow-[0_12px_35px_rgba(255,140,26,0.35)]'
          }`}
          aria-label={isOpen ? 'Close BE11 AI Assistant' : 'Open BE11 AI Assistant'}
          title="Ask BE11 AI"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <Sparkles className="w-6 h-6 text-white" />
              {/* Pulsing indicator badge */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8C1A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF8C1A] text-[9px] font-bold text-white items-center justify-center">
                  AI
                </span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* The Chat Window */}
      <AiChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMinimize={() => setIsOpen(false)}
        pageContext={pageContext}
      />
    </>
  );
};
