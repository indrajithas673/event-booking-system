import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import { getMyRegistrations, cancelRegistration } from '../services/registrationService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_STYLES = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  attended: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
};

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  attended: 'Attended',
};

const CATEGORY_GRADIENTS = [
  'from-primary-500 to-primary-700',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
];

const MyTicketsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useDocumentTitle('My Tickets');

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMyRegistrations({ limit: 50 });
      const data = response.data?.registrations || response.registrations || [];
      setRegistrations(data);
    } catch {
      toast.error('Failed to load your tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const stats = useMemo(() => {
    const upcoming = registrations.filter(
      (r) => r.status === 'confirmed' && r.event?.date && !isPast(new Date(r.event.date))
    ).length;
    const attended = registrations.filter((r) => r.status === 'attended').length;
    const cancelled = registrations.filter((r) => r.status === 'cancelled').length;
    return { upcoming, attended, cancelled };
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return registrations.filter(
          (r) => r.status === 'confirmed' && r.event?.date && !isPast(new Date(r.event.date))
        );
      case 'past':
        return registrations.filter(
          (r) => r.status === 'attended' || (r.status === 'confirmed' && r.event?.date && isPast(new Date(r.event.date)))
        );
      case 'cancelled':
        return registrations.filter((r) => r.status === 'cancelled');
      default:
        return registrations;
    }
  }, [registrations, activeTab]);

  const tabCounts = useMemo(() => ({
    all: registrations.length,
    upcoming: registrations.filter(
      (r) => r.status === 'confirmed' && r.event?.date && !isPast(new Date(r.event.date))
    ).length,
    past: registrations.filter(
      (r) => r.status === 'attended' || (r.status === 'confirmed' && r.event?.date && isPast(new Date(r.event.date)))
    ).length,
    cancelled: registrations.filter((r) => r.status === 'cancelled').length,
  }), [registrations]);

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error('Failed to copy code.');
    }
  };

  const openCancelModal = (registration) => {
    setSelectedRegistration(registration);
    setShowCancelModal(true);
  };

  const handleCancel = async () => {
    if (!selectedRegistration) return;

    setCancellingId(selectedRegistration._id);
    try {
      await cancelRegistration(selectedRegistration._id);
      toast.success('Registration cancelled successfully.');
      setShowCancelModal(false);
      setSelectedRegistration(null);
      await fetchRegistrations();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel registration.';
      toast.error(message);
    } finally {
      setCancellingId(null);
    }
  };

  const getGradient = (title) => {
    const index = title ? title.charCodeAt(0) % CATEGORY_GRADIENTS.length : 0;
    return CATEGORY_GRADIENTS[index];
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'upcoming':
        return {
          title: 'No upcoming events',
          description: 'No upcoming events. Browse events to find your next experience!',
          showCta: true,
        };
      case 'past':
        return {
          title: 'No past events',
          description: "You haven't attended any events yet.",
          showCta: true,
        };
      case 'cancelled':
        return {
          title: 'No cancelled registrations',
          description: 'No cancelled registrations.',
          showCta: false,
        };
      default:
        return {
          title: 'No tickets yet',
          description: "You haven't registered for any events yet.",
          showCta: true,
        };
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
          <div className="flex gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
                <div className="w-32 space-y-3 shrink-0 hidden sm:block">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Tickets</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium text-lg">Manage your event registrations</p>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.upcoming}</p>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.attended}</p>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attended</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.cancelled}</p>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cancelled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 bg-white dark:bg-slate-900 p-1.5 rounded-2xl w-fit shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-lg ${
                activeTab === tab.key
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

      {/* Ticket List */}
      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {getEmptyMessage().title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {getEmptyMessage().description}
          </p>
          {getEmptyMessage().showCta && (
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Browse Events
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((registration) => {
            const event = registration.event || {};
            const eventDate = event.date ? new Date(event.date) : null;
            const isEventPast = eventDate ? isPast(eventDate) : false;
            const isConfirmedUpcoming = registration.status === 'confirmed' && !isEventPast;
            const isCancelled = registration.status === 'cancelled';
            const venue = event.location?.venue;
            const city = event.location?.city;
            const locationStr = [venue, city].filter(Boolean).join(', ');

            return (
                <div
                  key={registration._id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${
                    isCancelled ? 'opacity-70 grayscale-[0.5]' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row h-full">
                    {/* Event Image */}
                    <Link
                      to={`/events/${event.slug}`}
                      className="sm:w-48 h-40 sm:h-auto shrink-0 block overflow-hidden relative"
                    >
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                      ) : (
                        <div className={`w-full h-full min-h-40 bg-linear-to-br ${getGradient(event.title)} flex items-center justify-center`}>
                          <svg className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
                      {/* Center Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-start gap-3 mb-3">
                          <Link
                            to={`/events/${event.slug}`}
                            className={`text-xl font-extrabold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate ${
                              isCancelled ? 'line-through' : ''
                            }`}
                          >
                            {event.title || 'Untitled Event'}
                          </Link>
                          <span className={`shrink-0 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${STATUS_STYLES[registration.status]}`}>
                            {STATUS_LABELS[registration.status]}
                          </span>
                        </div>

                        {/* Date */}
                        {eventDate && (
                          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <span>{format(eventDate, 'EEE, MMM dd, yyyy')}</span>
                            {event.time && (
                              <span className="text-slate-400 dark:text-slate-500">at {event.time}</span>
                            )}
                          </div>
                        )}

                        {/* Location */}
                        {locationStr && (
                          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span className="truncate">{locationStr}</span>
                          </div>
                        )}

                        {/* Seat */}
                        {registration.seat && (
                          <div className="flex items-center gap-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 mt-3 bg-slate-50 dark:bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                            <svg className="w-5 h-5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                            </svg>
                            <span>Seat: {registration.seat?.seatNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Right Side — Confirmation Code & Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-center gap-3 sm:gap-4 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 sm:pl-6">
                        {/* Confirmation Code */}
                        <div className="flex flex-col items-center sm:items-end gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Ticket Code</span>
                          <button
                            onClick={() => handleCopyCode(registration.confirmationCode)}
                            className="group/code flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                            title="Click to copy"
                          >
                            <span className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-[0.2em]">
                              {registration.confirmationCode}
                            </span>
                            {copiedCode === registration.confirmationCode ? (
                              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-slate-400 group-hover/code:text-slate-600 dark:group-hover/code:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-auto">
                          <Link
                            to={`/tickets/${registration._id}`}
                            className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-all shadow-sm hover:shadow-md"
                          >
                            View Ticket
                          </Link>
                          {isConfirmedUpcoming && (
                            <button
                              onClick={() => openCancelModal(registration)}
                              className="px-4 py-2 text-sm font-bold text-danger-600 dark:text-danger-400 bg-danger-50 hover:bg-danger-100 dark:bg-danger-900/20 dark:hover:bg-danger-900/40 rounded-xl transition-all"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
      )}

      {/* Cancel Registration Modal */}
      {showCancelModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!cancellingId) {
                setShowCancelModal(false);
                setSelectedRegistration(null);
              }
            }}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-danger-50 dark:bg-danger-900/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-danger-600 dark:text-danger-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Cancel Registration</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 font-medium mb-8">
              Are you sure you want to cancel your registration for{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedRegistration.event?.title}
              </span>?
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedRegistration(null);
                }}
                disabled={!!cancellingId}
                className="w-full sm:flex-1 py-3 px-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all"
              >
                Keep Ticket
              </button>
              <button
                onClick={handleCancel}
                disabled={!!cancellingId}
                className="w-full sm:flex-1 py-3 px-4 bg-danger-600 hover:bg-danger-700 text-white font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {cancellingId ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MyTicketsPage;
