import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

const TEAM_VALUES = [
  {
    title: 'Easy Discovery',
    description: 'Browse through curated events by category, location, or date to find exactly what you are looking for.',
    icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  },
  {
    title: 'Seamless Booking',
    description: 'Register for events instantly with just a few clicks. Get your digital ticket with a unique QR code.',
    icon: 'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',
  },
  {
    title: 'Organizer Tools',
    description: 'Create, publish, and manage events with a powerful dashboard. Track registrations and attendees in real time.',
    icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
  },
];

const TECH_STACK = [
  { name: 'React', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'JWT', category: 'Auth' },
];

const AboutPage = () => {
  useDocumentTitle('About');

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-linear-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            About EventBooking
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto">
            A full-stack event management platform where attendees discover events
            and organizers bring their ideas to life.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80V40C240 0 480 0 720 40C960 80 1200 80 1440 40V80H0Z"
              className="fill-gray-50 dark:fill-gray-900" />
          </svg>
        </div>
      </section>

      {/* What We Offer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            What We Offer
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Everything you need to discover, book, and manage events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TEAM_VALUES.map((item) => (
            <div
              key={item.title}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="mx-auto w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-white dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Built With
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Modern technologies powering the platform
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {TECH_STACK.map((tech) => (
              <span
                key={tech.name}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                           rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600"
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Ready to Get Started?
        </h2>
        <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
          Whether you want to attend amazing events or create your own, EventBooking has you covered.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/events"
            className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl
                       hover:bg-primary-700 transition-colors"
          >
            Explore Events
          </Link>
          <Link
            to="/auth/register"
            className="w-full sm:w-auto px-8 py-3 border border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300 font-semibold rounded-xl
                       hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Create an Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
