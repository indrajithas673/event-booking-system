import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getFeaturedEvents, getCategories } from '../services/eventService';
import EventCard from '../components/ui/EventCard';
import useDocumentTitle from '../hooks/useDocumentTitle';

const CATEGORY_ICONS = {
  conference: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
    </svg>
  ),
  workshop: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M11.42 15.17l-5.384-3.112A.75.75 0 005.25 12.75v5.25a.75.75 0 00.786.716l5.384-.312a.75.75 0 00.594-.734v-2.5zM17.25 7.5l-5.384-3.112a.75.75 0 00-.732 0L5.75 7.5m11.5 0l-5.384 3.112a.75.75 0 01-.732 0L5.75 7.5m11.5 0v2.5" />
    </svg>
  ),
  seminar: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
    </svg>
  ),
  meetup: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  concert: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
    </svg>
  ),
  sports: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a48.454 48.454 0 01-7.54 0" />
    </svg>
  ),
  networking: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  ),
  webinar: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  ),
};

const CATEGORY_COLORS = {
  conference: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50',
  workshop: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50',
  seminar: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50',
  meetup: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50',
  concert: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50',
  sports: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50',
  networking: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50',
  webinar: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
};

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Find Events',
    description: 'Browse through hundreds of events or search for something specific that interests you.',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'Register',
    description: 'Sign up for events instantly with just a few clicks. Quick, easy, and secure.',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Get Your Ticket',
    description: 'Receive your digital ticket with QR code. Show it at the event entrance.',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

const DEFAULT_CATEGORIES = [
  { name: 'Conference', slug: 'conference', eventCount: 0 },
  { name: 'Workshop', slug: 'workshop', eventCount: 0 },
  { name: 'Seminar', slug: 'seminar', eventCount: 0 },
  { name: 'Meetup', slug: 'meetup', eventCount: 0 },
  { name: 'Concert', slug: 'concert', eventCount: 0 },
  { name: 'Sports', slug: 'sports', eventCount: 0 },
  { name: 'Networking', slug: 'networking', eventCount: 0 },
  { name: 'Webinar', slug: 'webinar', eventCount: 0 },
];

const HomePage = () => {
  useDocumentTitle('Home');

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, categoriesRes] = await Promise.allSettled([
          getFeaturedEvents(),
          getCategories(),
        ]);

        if (eventsRes.status === 'fulfilled') {
          const eventsData = eventsRes.value.data?.events || eventsRes.value.data || eventsRes.value || [];
          setFeaturedEvents(Array.isArray(eventsData) ? eventsData : []);
        }

        if (categoriesRes.status === 'fulfilled') {
          const rawCat = categoriesRes.value.data?.categories || categoriesRes.value.data || categoriesRes.value || [];
          const catData = Array.isArray(rawCat) ? rawCat : [];
          if (catData.length > 0) {
            const normalized = catData.map((c) => ({
              name: c.name || (c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : ''),
              slug: c.slug || c.category || '',
              eventCount: c.eventCount ?? c.count ?? 0,
            }));
            setCategories(normalized);
          }
        }
      } catch {
        // Silently fail — homepage should still render with defaults
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (searchCategory) params.set('category', searchCategory);
    navigate(`/events?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative bg-slate-50 dark:bg-slate-950 overflow-hidden border-b border-slate-200 dark:border-slate-800 pt-16">
        {/* Subtle Background Mesh/Grid */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary-500 opacity-20 blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tighter leading-tight">
              Discover events.<br/>
              Choose your seat.<br/>
              <span className="bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent">Book instantly.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Browse, register, and manage your tickets all in one seamless platform.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-10 max-w-2xl mx-auto relative z-20">
              <div className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search events..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-transparent text-slate-900 dark:text-white
                               placeholder-slate-400 border-0 focus:ring-0 outline-none font-medium"
                  />
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-700 hidden sm:block my-2" />
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="px-4 py-3.5 bg-transparent text-slate-700 dark:text-slate-300
                             border-0 focus:ring-0 outline-none cursor-pointer font-medium"
                >
                  <option value="" className="dark:bg-slate-800">All Categories</option>
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug} className="dark:bg-slate-800">{cat.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl
                             hover:bg-primary-600 dark:hover:bg-primary-500 hover:text-white transition-all duration-300 shrink-0 shadow-md"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Trust Badges */}
            <div className="mt-14 flex flex-wrap items-center justify-center gap-8 sm:gap-12 relative z-10">
              {[
                { icon: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z', label: 'Verified Events' },
                { icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z', label: 'Secure Booking' },
                { icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', label: 'Instant Tickets' },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={badge.icon} />
                  </svg>
                  <span className="text-sm font-semibold">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURED EVENTS ═══════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Featured Events
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
              Don&apos;t miss out on these popular upcoming events
            </p>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold
                       text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20
                       rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
          >
            View All Events
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="h-56 bg-slate-200 dark:bg-slate-800" />
                <div className="p-5 space-y-4">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.slice(0, 6).map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No featured events yet</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Check back soon for exciting upcoming events!</p>
            <Link
              to="/events"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium
                         rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse All Events
            </Link>
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100
                       border-2 border-slate-200 dark:border-slate-800 rounded-full hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            View All Events
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════════ CATEGORIES ═══════════════ */}
      <section className="bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Browse by Category
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
              Find events that match your interests
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => {
              const slug = cat.slug || cat.name?.toLowerCase();
              const colorClass = CATEGORY_COLORS[slug] || 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700';

              return (
                <Link
                  key={slug}
                  to={`/events?category=${slug}`}
                  className={`group flex flex-col items-center gap-4 p-8 rounded-2xl transition-all duration-300
                             border border-slate-100 dark:border-slate-800 hover:-translate-y-1 hover:shadow-lg ${colorClass}`}
                >
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    {CATEGORY_ICONS[slug] || (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm sm:text-base">{cat.name}</div>
                    {cat.eventCount > 0 && (
                      <div className="text-xs opacity-75 mt-0.5">{cat.eventCount} {cat.eventCount === 1 ? 'event' : 'events'}</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="bg-slate-50 dark:bg-slate-900/20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 rounded-3xl my-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How It Works
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {HOW_IT_WORKS_STEPS.map((item, index) => (
            <div key={item.step} className="relative text-center">
              {/* Connector Line (desktop only) */}
              {index < HOW_IT_WORKS_STEPS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-slate-200 dark:border-slate-800" />
              )}

              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl
                              bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 mb-6 shadow-sm border border-slate-100 dark:border-slate-700 z-10">
                {item.icon}
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-primary-600 text-white text-xs font-bold
                                 rounded-full flex items-center justify-center shadow-md">
                  {item.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ CTA SECTION ═══════════════ */}
      <section className="m-4 sm:m-8 lg:m-12">
        <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/40 via-slate-900 to-slate-900 dark:via-slate-800 dark:to-slate-800"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to Host Your Own Event?
              </h2>
              <p className="mt-5 text-lg text-slate-300 font-medium">
                Join thousands of organizers who use EventBooking to create, manage,
                and promote their events effortlessly.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/auth/register"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-full
                             hover:bg-slate-100 hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  Sign Up as an Organizer
                </Link>
                <Link
                  to="/events"
                  className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-bold rounded-full
                             border-2 border-slate-700 hover:border-slate-500 transition-all duration-300"
                >
                  Explore Events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
