import { useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';

const CATEGORY_COLORS = {
  conference: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20',
  workshop: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20',
  seminar: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200/50 dark:border-green-500/20',
  meetup: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-500/20',
  concert: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400 border border-pink-200/50 dark:border-pink-500/20',
  sports: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/20',
  networking: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 border border-teal-200/50 dark:border-teal-500/20',
  webinar: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20',
};

const CATEGORY_GRADIENTS = [
  'from-primary-500 to-primary-700',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
];

const getCapacityColor = (percentage) => {
  if (percentage >= 90) return 'bg-danger-500';
  if (percentage >= 70) return 'bg-warning-500';
  return 'bg-success-500';
};

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  if (!event) return null;

  const {
    title,
    slug,
    category,
    date,
    location,
    venue: topVenue,
    city: topCity,
    price,
    currency,
    capacity = 0,
    registeredCount = 0,
    image,
  } = event;

  const venue = location?.venue || topVenue;
  const city = location?.city || topCity;

  const eventDate = date ? new Date(date) : null;
  const isEventPast = eventDate ? isPast(eventDate) : false;
  const isFull = capacity > 0 && registeredCount >= capacity;
  const spotsLeft = capacity - registeredCount;
  const capacityPercentage = capacity > 0 ? (registeredCount / capacity) * 100 : 0;

  const gradientIndex = title ? title.charCodeAt(0) % CATEGORY_GRADIENTS.length : 0;
  const categoryKey = category?.toLowerCase();
  const categoryColor = CATEGORY_COLORS[categoryKey] || 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50';

  const handleClick = () => {
    if (slug) navigate(`/events/${slug}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-black/40
                 border border-slate-100 dark:border-slate-800 overflow-hidden
                 transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`w-full h-full bg-linear-to-br ${CATEGORY_GRADIENTS[gradientIndex]}
                        flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}
          >
            <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
        )}

        {/* Category Badge */}
        <span className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 shadow-sm ${categoryColor}`}>
          {category}
        </span>

        {/* Price Badge */}
        <span className="absolute top-4 right-4 px-3 py-1.5 text-xs font-black tracking-wide rounded-full bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 backdrop-blur-md shadow-sm">
          {formatCurrency(price || 0, currency || 'USD')}
        </span>

        {/* Sold Out Overlay */}
        {isFull && !isEventPast && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-4 py-2 bg-danger-500 text-white text-sm font-bold rounded-full uppercase tracking-wider">
              Sold Out
            </span>
          </div>
        )}

        {/* Past Event Overlay */}
        {isEventPast && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-4 py-2 bg-gray-700 text-white text-sm font-bold rounded-full uppercase tracking-wider">
              Past Event
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-5 flex flex-col flex-1 ${isEventPast ? 'opacity-60' : ''}`}>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white line-clamp-2 mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </h3>

        {/* Date */}
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
          <svg className="w-4.5 h-4.5 shrink-0 text-primary-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>{eventDate ? format(eventDate, 'EEE, MMM dd, yyyy') : 'Date TBD'}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
          <svg className="w-4.5 h-4.5 shrink-0 text-primary-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">{[venue, city].filter(Boolean).join(', ')}</span>
        </div>

        {/* Capacity Bar */}
        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <span>{registeredCount} / {capacity} REGISTERED</span>
            <span className={`font-black tracking-wide ${isFull ? 'text-danger-500' : spotsLeft <= 10 ? 'text-warning-500' : 'text-success-500'}`}>
              {isFull ? 'SOLD OUT' : `${spotsLeft} SPOTS LEFT`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getCapacityColor(capacityPercentage)}`}
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
