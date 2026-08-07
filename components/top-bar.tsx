'use client';

import { Menu, Search, Bell, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-border h-16 flex items-center justify-between px-6 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 bg-muted px-4 py-2 rounded-lg max-w-sm flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients, queue numbers..."
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-critical-red rounded-full" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium">Dr. Sarah</p>
              <p className="text-xs text-muted-foreground">Triage Officer</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border z-50">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-medium text-foreground">Dr. Sarah Johnson</p>
                <p className="text-xs text-muted-foreground mt-1">Triage Officer</p>
              </div>
              <div className="p-2 space-y-1">
                <button className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm text-foreground">
                  Profile
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm text-foreground">
                  Settings
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm text-foreground">
                  Support
                </button>
                <hr className="my-2 border-border" />
                <button className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm text-critical-red">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
