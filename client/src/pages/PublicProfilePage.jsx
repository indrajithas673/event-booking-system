import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import * as userService from '../services/userService';
import EventCard from '../components/ui/EventCard';
import RoleBadge from '../components/ui/RoleBadge';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PublicProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalAttendees: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = currentUser?._id === id;

  useDocumentTitle(profile ? `${profile.name}'s Profile` : 'User Profile');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await userService.getPublicProfile(id);
        const userData = response.data.user;
        setProfile(userData);

        if (userData.role === 'organizer') {
          try {
            const orgResponse = await userService.getOrganizerProfile(id);
            const orgData = orgResponse.data;
            setEvents(orgData.events || []);

            const totalAttendees = (orgData.events || []).reduce(
              (sum, event) => sum + (event.registrationCount || 0),
              0
            );

            setStats({
              totalEvents: orgData.totalEvents || 0,
              totalAttendees,
            });
          } catch {
            // Organizer events could not be loaded, profile still visible
          }
        }
      } catch {
        setError('Profile not found or no longer available.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'This user does not exist or their profile is no longer available.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ═══════════════ PROFILE HEADER ═══════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Cover gradient */}
        <div className="h-32 sm:h-40 bg-linear-to-r from-primary-500 via-primary-600 to-purple-600" />

        <div className="px-6 sm:px-8 pb-8">
          {/* Avatar + Actions row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-14 mb-6">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-primary-600 dark:text-primary-400">
                    {(profile.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Edit Profile button */}
            {isOwnProfile && (
              <Link
                to="/settings"
                className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors text-sm self-start sm:self-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit Profile
              </Link>
            )}
          </div>

          {/* Name + Badge + Bio + Date */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {profile.name}
              </h1>
              <RoleBadge role={profile.role} />
            </div>

            {profile.bio && (
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>Member since {format(new Date(profile.createdAt), 'MMMM yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ ORGANIZER CONTENT ═══════════════ */}
      {profile.role === 'organizer' && (
        <div className="mt-10">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">
                {stats.totalEvents}
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">
                Events Organized
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalAttendees}
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">
                Total Attendees
              </div>
            </div>
          </div>

          {/* Events section */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Events by {profile.name}
            </h2>

            {events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Events Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  This organizer hasn&apos;t published any events yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ ATTENDEE CONTENT ═══════════════ */}
      {profile.role === 'attendee' && (
        <div className="mt-10">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Event Attendee</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
              {profile.name} is an event enthusiast exploring and attending events on the platform.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfilePage;
