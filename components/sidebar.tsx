'use client';

import { Heart, BarChart3, FileText, Settings, Users, LogOut } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '#', active: true },
    { icon: Users, label: 'Patient Registry', href: '#', active: false },
    { icon: Heart, label: 'Triage Assessment', href: '#', active: false },
    { icon: FileText, label: 'Reports', href: '#', active: false },
    { icon: Settings, label: 'Settings', href: '#', active: false },
  ];

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col h-screen overflow-hidden`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-white" />
        </div>
        {isOpen && (
          <div>
            <h1 className="text-lg font-bold text-foreground">MediQueue</h1>
            <p className="text-xs text-muted-foreground">Queue Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              item.active
                ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
            }`}
            title={!isOpen ? item.label : ''}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
