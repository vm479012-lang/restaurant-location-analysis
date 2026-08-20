'use client';

import { useState } from 'react';
import { Activity, LayoutDashboard, Map, PieChart, UtensilsCrossed, Menu, X, Building2 } from 'lucide-react';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {/* Always show logo text, or hide on very small screens if desired. Currently hidden below sm. Let's keep existing logic but ensure it looks good */}
          <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">Cognifyz Analytics</span>
          {/* Also show on mobile so there's a logo */}
          <span className="font-bold text-lg tracking-tight text-slate-900 sm:hidden">Cognifyz</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#overview" className="hover:text-blue-600 transition-colors flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4"/> Overview</a>
          <a href="#map" className="hover:text-blue-600 transition-colors flex items-center gap-1.5"><Map className="w-4 h-4"/> Map</a>
          <a href="#analytics" className="hover:text-blue-600 transition-colors flex items-center gap-1.5"><PieChart className="w-4 h-4"/> Analytics</a>
          <a href="#restaurants" className="hover:text-blue-600 transition-colors flex items-center gap-1.5"><UtensilsCrossed className="w-4 h-4"/> Restaurants</a>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          onClick={toggleMenu}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 pt-2 pb-6 space-y-2 max-w-[1400px] mx-auto">
            <a 
              href="#overview" 
              onClick={closeMenu}
              className="flex items-center gap-3 p-4 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 text-slate-400"/> Overview
            </a>
            <a 
              href="#map" 
              onClick={closeMenu}
              className="flex items-center gap-3 p-4 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
            >
              <Map className="w-5 h-5 text-slate-400"/> Map
            </a>
            <a 
              href="#analytics" 
              onClick={closeMenu}
              className="flex items-center gap-3 p-4 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
            >
              <PieChart className="w-5 h-5 text-slate-400"/> Analytics
            </a>
            <a 
              href="#restaurants" 
              onClick={closeMenu}
              className="flex items-center gap-3 p-4 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
            >
              <UtensilsCrossed className="w-5 h-5 text-slate-400"/> Restaurants
            </a>
            <a 
              href="#explore" 
              onClick={(e) => {
                closeMenu();
                // Optionally add a tiny timeout to let the menu close before focusing
                setTimeout(() => {
                  const citySelect = document.getElementById('city-filter');
                  if (citySelect) citySelect.focus();
                }, 100);
              }}
              className="flex items-center gap-3 p-4 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
            >
              <Building2 className="w-5 h-5 text-slate-400"/> Explore Cities
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
