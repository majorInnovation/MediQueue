'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Clock,
  Zap,
  Shield,
  BarChart3,
  Smartphone,
  Activity,
  CheckCircle,
  UserPlus,
  ClipboardCheck,
  BellRing,
} from 'lucide-react'

function Logo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div className={`${className} bg-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 flex-shrink-0`}>
      <svg width="55%" height="55%" viewBox="0 0 34 34" fill="none">
        <rect x="14" y="3" width="6" height="28" rx="2.5" fill="white" />
        <rect x="3" y="14" width="28" height="6" rx="2.5" fill="white" />
      </svg>
    </div>
  )
}

export default function HomePage() {
  const year = new Date().getFullYear()

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Real-Time Queue Management',
      description: 'Live queue tracking with priority-based scheduling and automatic patient notifications.',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Smart Triage System',
      description: 'AI-assisted patient assessment with automated priority scoring based on medical indicators.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Advanced Analytics',
      description: 'Comprehensive reporting and insights for operational optimization and performance tracking.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'HIPAA Compliant',
      description: 'Enterprise-grade security with encryption and role-based access controls.',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Multi-Channel Notifications',
      description: 'SMS, email, and in-app notifications to keep patients informed every step of the way.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Optimized performance designed to handle high-volume clinic environments seamlessly.',
    },
  ]

  const stats = [
    { label: 'Healthcare Facilities', value: '2,500+' },
    { label: 'Patients Managed Daily', value: '500K+' },
    { label: 'Average Wait Time Reduction', value: '45%' },
    { label: 'System Uptime', value: '99.9%' },
  ]

  const steps = [
    {
      icon: <UserPlus className="w-6 h-6" />,
      title: 'Register & Check In',
      description: 'Reception registers walk-ins and checks in appointments in seconds — no paperwork.',
    },
    {
      icon: <ClipboardCheck className="w-6 h-6" />,
      title: 'Get Triaged & Queued',
      description: 'Clinical staff assess urgency and the system automatically assigns a fair queue position.',
    },
    {
      icon: <BellRing className="w-6 h-6" />,
      title: 'Get Notified & Seen',
      description: "Patients track their live position from anywhere and get notified the moment it's their turn.",
    },
  ]

  const benefits = [
    {
      title: 'For Administrators',
      points: [
        'Complete operational visibility',
        'Staff performance analytics',
        'Custom reporting and exports',
        'System configuration & settings',
      ],
    },
    {
      title: 'For Reception Staff',
      points: [
        'Fast patient registration',
        'Smart queue assignment',
        'Real-time status updates',
        'Easy patient lookup',
      ],
    },
    {
      title: 'For Clinicians',
      points: [
        'Streamlined patient triage',
        'Clinical assessment tools',
        'Patient history access',
        'Prioritization guidance',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="w-9 h-9" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">MediQueue</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm font-semibold bg-blue-800 hover:bg-blue-900 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              Register Your Clinic
            </Link>
          </div>
        </div>
      </nav>

      {/* CTA Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-700 to-blue-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Clinic?
          </h2>
          <p className="text-xl text-blue-100 mb-8 text-balance">
            Join thousands of healthcare facilities using MediQueue to deliver exceptional patient care.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-800 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
            >
              Register Your Clinic
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800" id="hero">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-semibold text-blue-800 dark:text-blue-300 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live queue tracking, built for modern clinics
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 text-balance">
                Healthcare Queue Management Reimagined
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 text-balance">
                MediQueue is an enterprise-grade queue management system designed for modern healthcare facilities. Streamline operations, reduce wait times, and improve patient satisfaction.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Register Your Clinic
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-blue-800 text-blue-800 dark:text-blue-400 dark:border-blue-400 font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-all"
                >
                  Sign In
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Built for clinic staff
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Set up in minutes
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  No credit card required
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl blur-2xl opacity-20"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Ticket</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      Live
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-800 dark:text-blue-400">Q-0247</span>
                      <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-full">
                        Waiting
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Position: 3 of 12</div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-700 h-2 rounded-full w-1/4"></div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Est. Wait: 8 minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-blue-800 dark:text-blue-400 mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage healthcare queues efficiently and professionally.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-800 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From check-in to consultation, patients stay informed at every step.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, i) => (
              <div key={i} className="relative bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    {step.icon}
                  </div>
                  <span className="text-sm font-bold text-blue-800 dark:text-blue-400">STEP {i + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tailored roles and workflows for every member of your healthcare team.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {benefit.title}
                </h3>
                <ul className="space-y-3">
                  {benefit.points.map((point, j) => (
                    <li key={j} className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 pb-8 border-b border-gray-800">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                <Logo className="w-8 h-8" />
                <span className="font-bold text-white">MediQueue</span>
              </div>
              <p className="text-sm text-gray-500">
                Enterprise-grade queue management for modern healthcare facilities.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="text-sm font-semibold text-white mb-3">Get Started</p>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-white transition-colors">Register Your Clinic</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-3">Product</p>
                <ul className="space-y-2 text-sm">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; {year} MediQueue. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Professional Healthcare Queue Management System
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
