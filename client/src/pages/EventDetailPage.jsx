import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, isPast, differenceInHours, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getEventBySlug, getEvents } from '../services/eventService';
import { registerForEvent, cancelRegistration } from '../services/registrationService';
import { getSeats, lockSeat, unlockSeat } from '../services/seatService';
import EventCard from '../components/ui/EventCard';
import SeatGrid from '../components/ui/SeatGrid';
import { formatCurrency } from '../utils/formatters';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { io } from 'socket.io-client';

const CATEGORY_COLORS = {
  conference: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  workshop: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  seminar: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  meetup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  concert: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  sports: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  networking: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  webinar: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

const CATEGORY_GRADIENTS = [
  'from-primary-500 to-primary-700',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
];

const TAG_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
];

const getCapacityColor = (percentage) => {
  if (percentage >= 90) return 'bg-danger-500';
  if (percentage >= 70) return 'bg-warning-500';
  return 'bg-success-500';
};

const formatDuration = (start, end) => {
  const hours = differenceInHours(new Date(end), new Date(start));
  const totalMinutes = differenceInMinutes(new Date(end), new Date(start));
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const EventDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [lockedSeat, setLockedSeat] = useState(null);

  useDocumentTitle(event?.title || 'Event Detail');

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getEventBySlug(slug);
      const responseData = response.data || response;
      const eventObj = responseData.event || responseData;
      if (responseData.isRegistered) {
        eventObj.userRegistration = responseData.userRegistration || { _registered: true };
      }
      setEvent(eventObj);

      if (eventObj.category) {
        try {
          const relatedRes = await getEvents({
            category: eventObj.category,
            limit: 5,
            status: 'published',
          });
          const allRelated = relatedRes.data?.events || relatedRes.data || relatedRes.events || [];
          setRelatedEvents(
            allRelated.filter((e) => e._id !== eventObj._id).slice(0, 4)
          );
        } catch {
          // Silently fail for related events
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Failed to load event details.');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    if (event) {
      getSeats(event._id)
        .then((res) => {
          setSeats(res.data?.seats || res.seats || []);
        })
        .catch(console.error);

      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true,
      });

      socket.emit('joinEvent', event._id);

      socket.on('seatUpdated', (updatedSeat) => {
        setSeats((prev) =>
          prev.map((s) => (s._id === updatedSeat._id ? updatedSeat : s))
        );
      });

      return () => {
        socket.emit('leaveEvent', event._id);
        socket.disconnect();
      };
    }
  }, [event]);

  const eventDate = event ? new Date(event.date) : null;
  const endDate = event?.endDate ? new Date(event.endDate) : null;
  const isEventPast = eventDate ? isPast(eventDate) : false;
  const isFull = event ? (event.registeredCount || 0) >= event.capacity : false;
  const capacityPercentage = event?.capacity > 0
    ? ((event.registeredCount || 0) / event.capacity) * 100
    : 0;

  const isOrganizer = user && event?.organizer && (
    user._id === event.organizer._id || user._id === event.organizer
  );
  const userRegistration = event?.userRegistration || null;
  const isRegistered = !!userRegistration;

  const categoryKey = event?.category?.toLowerCase();
  const categoryColor = CATEGORY_COLORS[categoryKey] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  const gradientIndex = event?.title ? event.title.charCodeAt(0) % CATEGORY_GRADIENTS.length : 0;

  const venue = event?.location?.venue || event?.venue;
  const address = event?.location?.address || event?.address;
  const city = event?.location?.city || event?.city;
  const country = event?.location?.country || event?.country;

  const fullAddress = [venue, address, city, country]
    .filter(Boolean)
    .join(', ');
  const onlineKeywords = /\b(online|virtual|zoom|teams|webinar|remote|google meet|livestream)\b/i;
  const isOnlineEvent = onlineKeywords.test(fullAddress);
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;

  const handleSeatSelect = async (seat) => {
    if (lockedSeat && lockedSeat._id === seat._id) {
      return; // Already locked by us
    }

    if (lockedSeat) {
      try {
        await unlockSeat(event._id, lockedSeat._id);
      } catch (err) {
        console.error('Failed to unlock seat', err);
      }
      setLockedSeat(null);
      setSelectedSeat(null);
    }

    if (seat.status === 'AVAILABLE') {
      setSelectedSeat(seat._id);
      try {
        const res = await lockSeat(event._id, seat._id);
        setLockedSeat(res.data?.seat || res.seat);
        toast.success(`Seat ${seat.seatNumber} locked for 5 minutes.`);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to lock seat');
        setSelectedSeat(null);
      }
    }
  };

  const handleRegister = async () => {
    if (!lockedSeat) {
      toast.error('Please select and lock a seat first.');
      return;
    }
    setRegistrationLoading(true);
    try {
      await registerForEvent(event._id, { seatId: lockedSeat._id, notes });
      toast.success('Registration confirmed!');
      setShowRegisterModal(false);
      setNotes('');
      setLockedSeat(null);
      setSelectedSeat(null);
      await fetchEvent();
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    setRegistrationLoading(true);
    try {
      await cancelRegistration(userRegistration._id || userRegistration);
      toast.success('Registration cancelled.');
      setShowCancelModal(false);
      await fetchEvent();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel registration.';
      toast.error(message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative h-72 sm:h-96 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 404
  if (notFound || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center">
          <h1 className="text-7xl font-bold text-primary-600 dark:text-primary-400">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Event Not Found
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The event you are looking for does not exist or has been removed.
          </p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const organizer = event.organizer || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ═══════════════ EVENT HEADER ═══════════════ */}
      <section className="relative h-80 sm:h-[450px] overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-linear-to-br ${CATEGORY_GRADIENTS[gradientIndex]}`} />
        )}

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

        {/* Header content */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10">
            <span className={`inline-block px-4 py-1.5 text-xs font-black tracking-widest uppercase rounded-full backdrop-blur-md bg-white/20 text-white border border-white/30 mb-5 shadow-sm`}>
              {event.category}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-200 text-sm sm:text-base font-medium">
              {/* Date & Time */}
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span>{format(eventDate, 'EEEE, MMMM dd, yyyy')}</span>
                {event.time && (
                  <span className="text-slate-400">at {event.time}</span>
                )}
              </div>

              {/* Location */}
              {(venue || city) && (
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 shrink-0 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>{[venue, city, country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left Column (65%) */}
          <div className="lg:col-span-3 space-y-10">
            {/* Description */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">About This Event</h2>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                {event.description}
              </div>
            </div>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {event.tags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`px-4 py-2 text-sm font-bold rounded-full ${TAG_COLORS[index % TAG_COLORS.length]}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Seat Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Select a Seat</h2>
              {isRegistered ? (
                <div className="text-slate-600 dark:text-slate-400 font-medium">
                  You are already registered. Your seat is <span className="font-bold text-slate-900 dark:text-white">{userRegistration.seat?.seatNumber || 'assigned'}</span>.
                </div>
              ) : (
                <SeatGrid
                  seats={seats}
                  selectedSeat={selectedSeat}
                  lockedByMe={user?._id}
                  onSeatSelect={handleSeatSelect}
                />
              )}
            </div>

            {/* Event Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Event Details</h2>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-8 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {format(eventDate, 'MMM dd, yyyy')}
                    </p>
                    {event.time && (
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{event.time}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                   Selected Seat: <span className="font-extrabold text-primary-600 dark:text-primary-400">{lockedSeat?.seatNumber || 'None'}</span>
                </div>
              </div>
              <div className="space-y-6">
                {/* Date & Time */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Date & Time</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-1">
                      {format(eventDate, 'EEEE, MMMM dd, yyyy')}
                    </p>
                    {event.time && (
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{event.time}</p>
                    )}
                    {endDate && (
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Duration: {formatDuration(eventDate, endDate)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                {fullAddress && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Location</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-1">{venue}</p>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {[address, city, country].filter(Boolean).join(', ')}
                      </p>
                      {!isOnlineEvent && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline mt-2"
                        >
                          View on Google Maps
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Category */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h.008v.008H6V6z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Category</p>
                    <p className="font-bold text-slate-900 dark:text-white capitalize mt-1">{event.category}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Price</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-1">
                      {formatCurrency(event.price || 0, event.currency || 'USD')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (35%) */}
          <div className="lg:col-span-2">
            {/* Registration Card - Sticky */}
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-lg shadow-slate-200/50 dark:shadow-black/40">
                {/* Price Display */}
                <div className="text-center mb-6">
                  <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(event.price || 0, event.currency || 'USD')}
                  </p>
                </div>

                {/* Capacity Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                    <span>{event.registeredCount || 0} OF {event.capacity} SPOTS FILLED</span>
                    <span className="font-black text-slate-700 dark:text-slate-300">
                      {Math.round(capacityPercentage)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getCapacityColor(capacityPercentage)}`}
                      style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Registration Actions */}
                <div className="space-y-4">
                  {isEventPast ? (
                    <div className="w-full py-3.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-center font-bold rounded-xl">
                      This event has ended
                    </div>
                  ) : isOrganizer ? (
                    <>
                      <div className="flex items-center gap-2 justify-center py-3.5 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <span className="text-sm">You are the organizer</span>
                      </div>
                      <Link
                        to={`/organizer/events/${event._id}/edit`}
                        className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit Event
                      </Link>
                    </>
                  ) : isRegistered ? (
                    <>
                      <div className="text-center py-5 px-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 font-extrabold mb-2">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          You&apos;re Registered!
                        </div>
                        {userRegistration.confirmationCode && (
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Confirmation: <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{userRegistration.confirmationCode}</span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full py-3.5 px-4 border-2 border-danger-200 dark:border-danger-900/50 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 hover:border-danger-300 font-bold rounded-xl transition-all"
                      >
                        Cancel Registration
                      </button>
                    </>
                  ) : !isAuthenticated ? (
                    <button
                      onClick={() => navigate('/auth/login', { state: { from: `/events/${slug}` } })}
                      className="w-full py-4 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-md"
                    >
                      Login to Register
                    </button>
                  ) : isFull ? (
                    <>
                      <button
                        disabled
                        className="w-full py-4 px-4 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl cursor-not-allowed"
                      >
                        Event is Full
                      </button>
                      <p className="text-sm font-medium text-center text-slate-500 dark:text-slate-400">
                        Join Waitlist (coming soon)
                      </p>
                    </>
                  ) : (
                    <>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any notes for the organizer? (optional)"
                        rows={3}
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-sm font-medium transition-all"
                      />
                      <button
                        disabled={!lockedSeat}
                        onClick={() => setShowRegisterModal(true)}
                        className={`w-full py-4 px-4 text-white font-bold rounded-xl transition-all shadow-md ${lockedSeat ? 'bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5' : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'}`}
                      >
                        {lockedSeat ? `Book Seat ${lockedSeat.seatNumber}` : 'Select a Seat First'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ ORGANIZER INFO ═══════════════ */}
        {organizer && (organizer.firstName || organizer.name) && (
          <div className="mt-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Organizer</h2>
            <div className="flex items-start gap-5">
              {organizer.avatar ? (
                <img
                  src={organizer.avatar}
                  alt={organizer.firstName || organizer.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">
                    {(organizer.firstName || organizer.name || 'O').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0 mt-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {organizer.firstName && organizer.lastName
                    ? `${organizer.firstName} ${organizer.lastName}`
                    : organizer.name || 'Organizer'}
                </h3>
                {organizer.bio && (
                  <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {organizer.bio}
                  </p>
                )}
                {organizer.organizedEventsCount > 0 && (
                  <p className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {organizer.organizedEventsCount} events organized
                  </p>
                )}
                <Link
                  to={`/users/${organizer._id}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 hover:underline transition-colors"
                >
                  View Profile
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ RELATED EVENTS ═══════════════ */}
        {relatedEvents.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Related Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedEvents.slice(0, 3).map((relEvent) => (
                <EventCard key={relEvent._id} event={relEvent} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════ REGISTER MODAL ═══════════════ */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRegisterModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
              Confirm Registration
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
              Are you sure you want to register for <span className="font-bold text-slate-900 dark:text-white">{event.title}</span>?
            </p>

            {/* Event summary */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-6 space-y-3 border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Date</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {format(new Date(event.date), 'MMM dd, yyyy')}
                </span>
              </div>
              {(venue || city) && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Location</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right max-w-[200px] truncate">
                    {venue || city}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-slate-200 dark:border-slate-600 pt-3">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Price</span>
                <span className="font-extrabold text-xl text-slate-900 dark:text-white">
                  {formatCurrency(event.price || 0, event.currency || 'USD')}
                </span>
              </div>
            </div>

            {/* Payment notice for paid events */}
            {event.price > 0 && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Payment of <span className="font-bold">{formatCurrency(event.price, event.currency || 'USD')}</span> will be collected at the venue. By confirming, you reserve your spot.
                </p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowRegisterModal(false)}
                disabled={registrationLoading}
                className="flex-1 py-3.5 px-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={registrationLoading}
                className="flex-1 py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-md"
              >
                {registrationLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering...
                  </>
                ) : event.price > 0 ? (
                  `Confirm & Reserve`
                ) : (
                  'Confirm Registration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ CANCEL MODAL ═══════════════ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
              Cancel Registration
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
              Are you sure you want to cancel your registration for <span className="font-bold text-slate-900 dark:text-white">{event.title}</span>?
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={registrationLoading}
                className="flex-1 py-3.5 px-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all"
              >
                Keep It
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={registrationLoading}
                className="flex-1 py-3.5 px-4 bg-danger-500 hover:bg-danger-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-md"
              >
                {registrationLoading ? (
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
  );
};

export default EventDetailPage;
