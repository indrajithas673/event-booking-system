const ROLE_CONFIG = {
  attendee: {
    label: 'Attendee',
    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  organizer: {
    label: 'Organizer',
    classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
  admin: {
    label: 'Admin',
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    dot: 'bg-red-500',
  },
};

const RoleBadge = ({ role }) => {
  const config = ROLE_CONFIG[role?.toLowerCase()] || {
    label: role || 'Unknown',
    classes: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    dot: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default RoleBadge;
