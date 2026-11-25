// Single source for page metadata, navigation order and the sitemap.
export const origin = 'https://fiscal-fox.synctune.it';
export const docsAsOf = '15 November 2026';

export const home = {
  path: 'index.html',
  title: 'Fiscal Fox | Self-hosted accounting for small businesses',
  description:
    'Fiscal Fox is a self-hosted accounting workspace for small businesses in the Netherlands: invoices, receipts, payments, contracts, time, trips, VAT and reports in one audited ledger.',
};

export const sections = [
  {
    id: 'manual',
    label: 'User manual',
    pages: [
      { path: 'manual/index.html', title: 'Getting started', description: 'Sign in, create your organization, find your way around Fiscal Fox and learn what each role can do.' },
      { path: 'manual/dashboard.html', title: 'Dashboard', description: 'What the Fiscal Fox dashboard widgets show and how to choose which ones appear.' },
      { path: 'manual/sales.html', title: 'Sales', description: 'Create quotes and invoices in Fiscal Fox, finalize and send them, and follow them until they are paid.' },
      { path: 'manual/expenses.html', title: 'Expenses', description: 'Upload supplier receipts, check what Fiscal Fox read from them and approve them into the books.' },
      { path: 'manual/time-and-trips.html', title: 'Time and trips', description: 'Log hours and business trips, approve them and turn billable work into an invoice.' },
      { path: 'manual/contacts.html', title: 'Contacts, projects, and catalog', nav: 'Contacts and catalog', description: 'Manage customers, suppliers, draft contacts, projects with hourly rates and the products and services you sell.' },
      { path: 'manual/payments.html', title: 'Payments', description: 'Take card payments through your own Stripe account, follow payments and fees, and issue refunds.' },
      { path: 'manual/reports.html', title: 'Reports and VAT', description: 'Financial reports, exports for your accountant and the quarterly Dutch VAT return, box by box.' },
      { path: 'manual/contracts.html', title: 'Contracts', description: 'Prepare agreements from templates and follow them until they are signed.' },
      { path: 'manual/bookkeeping.html', title: 'Bookkeeping', description: 'Journal entries, the chart of accounts and fiscal periods behind everything in Fiscal Fox.' },
      { path: 'manual/imports-exports.html', title: 'Import and export', description: 'Import contacts, catalog items, time and trips from CSV, and download every file Fiscal Fox generated.' },
      { path: 'manual/activity-log.html', title: 'Activity log', description: 'The audit trail of every change and the background jobs that do work for you.' },
      { path: 'manual/settings.html', title: 'Settings', description: 'Organization details, receipt reading and AI options, members, roles and invitations.' },
      { path: 'manual/accounting.html', title: 'Accounting rules', description: 'How Fiscal Fox books documents and calculates the Dutch VAT return, ICP, OSS, KOR, statements and mileage.' },
    ],
  },
  {
    id: 'self-hosting',
    label: 'Self-hosting',
    pages: [
      { path: 'self-hosting/index.html', title: 'Install and run', description: 'What Fiscal Fox runs on, its requirements and how to start an installation with Docker Compose.' },
      { path: 'self-hosting/configuration.html', title: 'Configuration', description: 'Environment variables, database roles, secrets and service boundaries for a Fiscal Fox installation.' },
      { path: 'self-hosting/integrations.html', title: 'Integrations', description: 'Email, storage, Stripe, DocuSign, calendars, maps, receipt reading and Peppol UBL files.' },
      { path: 'self-hosting/production.html', title: 'Production checklist', description: 'What to put in place before running Fiscal Fox in production.' },
      { path: 'self-hosting/backup-restore.html', title: 'Backup and restore', description: 'Signed Fiscal Fox backups, the trusted restore process, credential invalidation and restore drills.' },
      { path: 'self-hosting/api.html', title: 'API', description: 'The Fiscal Fox REST API, its OpenAPI document, errors and report endpoints.' },
    ],
  },
];

export const docPages = sections.flatMap((section) => section.pages.map((page) => ({ ...page, section })));
export const allPages = [home, ...docPages];

export function canonicalUrl(pagePath) {
  return `${origin}/${pagePath.replace(/(^|\/)index\.html$/, '$1')}`;
}
