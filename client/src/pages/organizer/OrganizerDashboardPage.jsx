import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import * as organizerService from '../../services/organizerService';
import CapacityBar from '../../components/ui/CapacityBar';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const STAT_CARDS = [
  {
    key: 'totalEvents',
    label: 'Total Events',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    colorClasses: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    format: (val) => val ?? 0,
  },
  {
    key: 'totalRegistered',
    label: 'Total Registrations',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
    colorClasses: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    format: (val) => val ?? 0,
  },
  {
    key: 'totalRevenue',
    label: 'Estimated Revenue',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    colorClasses: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    format: (val) => `$${(val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
  },
  {
    key: 'capacityUtilization',
    label: 'Capacity Usage',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    colorClasses: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    format: (val) => `${Math.round(val ?? 0)}%`,
  },
];

const OrganizerDashboardPage = () => {
  useDocumentTitle('Organizer Dashboard');

  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, eventsRes, registrationsRes, revenueRes] = await Promise.allSettled([
          organizerService.getDashboardStats(),
          organizerService.getUpcomingEvents(),
          organizerService.getRecentRegistrations(),
          organizerService.getRevenueBreakdown(),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data || statsRes.value);
        }
        if (eventsRes.status === 'fulfilled') {
          setUpcomingEvents(eventsRes.value.data || eventsRes.value || []);
        }
        if (registrationsRes.status === 'fulfilled') {
          setRecentRegistrations(registrationsRes.value.data || registrationsRes.value || []);
        }
        if (revenueRes.status === 'fulfilled') {
          setRevenueBreakdown(revenueRes.value.data || revenueRes.value || []);
        }
      } catch {
        // Dashboard should still render with defaults
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const maxRevenue = revenueBreakdown.length > 0
    ? Math.max(...revenueBreakdown.map((r) => r.revenue || 0))
    : 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* ═══════ Welcome Header ═══════ */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome back, {user?.name || 'Organizer'}!
        </h1>
        <p className="mt-2 text-lg font-medium text-slate-500 dark:text-slate-400">
          {format(new Date(), 'EEEE, MMMM dd, yyyy')}
        </p>
      </div>

      {/* ═══════ Stats Cards ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800
                       p-6 flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${card.colorClasses}`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
                {card.format(stats?.[card.key])}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ Main Content Grid ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Events — ~60% */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Upcoming Events</h2>
            <Link
              to="/organizer/events/create"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white
                         bg-primary-600 hover:bg-primary-700 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Event
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {upcomingEvents.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">No upcoming events. Create your first event!</p>
                <Link
                  to="/organizer/events/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white
                             bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md"
                >
                  Create New Event
                </Link>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event._id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{event.title}</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {format(new Date(event.date), 'EEE, MMM dd, yyyy')}
                      </p>
                      <div className="mt-3 max-w-xs">
                        <CapacityBar
                          current={event.registeredCount || 0}
                          total={event.capacity || 0}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/events/${event.slug}`}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300
                                   bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700
                                   rounded-lg transition-colors border border-transparent dark:border-slate-700"
                      >
                        View
                      </Link>
                      <Link
                        to={`/organizer/events/${event._id}/edit`}
                        className="px-3 py-1.5 text-xs font-bold text-primary-700 dark:text-primary-300
                                   bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50
                                   rounded-lg transition-colors border border-transparent dark:border-primary-900/20"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/organizer/events/${event._id}/attendees`}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300
                                   bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50
                                   rounded-lg transition-colors border border-transparent dark:border-emerald-900/20"
                      >
                        Attendees
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Registrations — ~40% */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Recent Registrations</h2>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Latest 10</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {recentRegistrations.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No registrations yet.</p>
              </div>
            ) : (
              recentRegistrations.slice(0, 10).map((reg) => (
                <div key={reg._id} className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span
                    className={`shrink-0 w-3 h-3 rounded-full ${
                      reg.status === 'cancelled' ? 'bg-danger-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                    }`}
                    title={reg.status || 'confirmed'}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {reg.attendeeName || reg.user?.name || 'Unknown'}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {reg.eventTitle || reg.event?.title || 'Unknown Event'}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
                    {formatDistanceToNow(new Date(reg.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════ Revenue Breakdown ═══════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Revenue Breakdown</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Revenue per event</p>
        </div>

        <div className="p-5">
          {revenueBreakdown.length === 0 ? (
            <div className="text-center py-6">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No revenue data available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revenueBreakdown.map((item) => {
                const barWidth = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;

                return (
                  <div key={item._id || item.eventId} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                        {item.title || item.eventTitle}
                      </span>
                      <div className="flex items-center gap-3 text-sm shrink-0">
                        <span className="text-gray-400 dark:text-gray-500">
                          {item.confirmedCount ?? item.registrations ?? 0} registered
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(item.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-700 ease-out group-hover:bg-primary-600"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Welcome skeleton */}
    <div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mt-2" />
    </div>

    {/* Stats skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        </div>
      ))}
    </div>

    {/* Content grid skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Revenue skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
        </div>
      ))}
    </div>
  </div>
);

export default OrganizerDashboardPage;
