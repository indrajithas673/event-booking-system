import useDocumentTitle from '../hooks/useDocumentTitle';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By creating an account or using EventBooking, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.',
  },
  {
    title: '2. Account Responsibilities',
    content:
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration.',
  },
  {
    title: '3. Event Registration',
    content:
      'When you register for an event through our platform, you agree to abide by the event organizer\'s rules and policies. EventBooking acts as a facilitator and is not responsible for the content, quality, or safety of third-party events.',
  },
  {
    title: '4. Organizer Obligations',
    content:
      'Event organizers are responsible for the accuracy of event details including dates, locations, pricing, and descriptions. Organizers must honor confirmed registrations and communicate any changes promptly.',
  },
  {
    title: '5. Cancellation & Refunds',
    content:
      'Cancellation and refund policies are determined by individual event organizers. EventBooking is not liable for refund disputes between attendees and organizers.',
  },
  {
    title: '6. Prohibited Conduct',
    content:
      'Users may not use the platform for any unlawful purpose, post misleading event information, harass other users, attempt to gain unauthorized access to accounts, or engage in any activity that disrupts the service.',
  },
  {
    title: '7. Intellectual Property',
    content:
      'All content, trademarks, and materials on EventBooking are the property of their respective owners. You may not reproduce, distribute, or create derivative works without prior written consent.',
  },
  {
    title: '8. Limitation of Liability',
    content:
      'EventBooking is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.',
  },
  {
    title: '9. Changes to Terms',
    content:
      'We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms. We will notify users of significant changes via email.',
  },
  {
    title: '10. Contact',
    content:
      'If you have questions about these Terms of Service, please contact us through the information provided on the platform.',
  },
];

const TermsPage = () => {
  useDocumentTitle('Terms of Service');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Terms of Service
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">
          Last updated: April 2026
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {SECTIONS.map((section) => (
            <div key={section.title} className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {section.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
