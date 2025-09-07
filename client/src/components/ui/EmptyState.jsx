import { Link } from 'react-router-dom';

const VARIANTS = {
  noEvents: {
    icon: '📅',
    title: 'No events found',
    description: 'There are no events matching your criteria. Try adjusting your filters or browse all events.',
    actionLabel: 'Browse Events',
    actionLink: '/events',
  },
  noTickets: {
    icon: '🎟️',
    title: 'No tickets yet',
    description: "You haven't registered for any events yet. Discover exciting events and get your tickets!",
    actionLabel: 'Browse Events',
    actionLink: '/events',
  },
  noAttendees: {
    icon: '👥',
    title: 'No registrations yet',
    description: 'No one has registered for this event yet. Share your event to attract attendees!',
    actionLabel: 'Share Your Event',
    actionLink: null,
  },
  noResults: {
    icon: '🔍',
    title: 'No results',
    description: "We couldn't find anything matching your search. Try different keywords or filters.",
    actionLabel: 'Try Different Search',
    actionLink: null,
  },
};

const EmptyState = ({
  variant,
  icon,
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
}) => {
  const preset = variant ? VARIANTS[variant] : {};
  const resolvedIcon = icon || preset.icon || '📭';
  const resolvedTitle = title || preset.title || 'Nothing here';
  const resolvedDescription = description || preset.description || '';
  const resolvedActionLabel = actionLabel || preset.actionLabel;
  const resolvedActionLink = actionLink !== undefined ? actionLink : preset.actionLink;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-6xl mb-4" role="img" aria-hidden="true">
        {resolvedIcon}
      </span>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {resolvedTitle}
      </h3>

      {resolvedDescription && (
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          {resolvedDescription}
        </p>
      )}

      {resolvedActionLabel && resolvedActionLink && (
        <Link
          to={resolvedActionLink}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          {resolvedActionLabel}
        </Link>
      )}

      {resolvedActionLabel && !resolvedActionLink && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          {resolvedActionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
