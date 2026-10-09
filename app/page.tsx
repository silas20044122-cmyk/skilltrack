import { redirect } from 'next/navigation';

/**
 * Root route: the Sprint 1 mock demo shell (role switcher + mock dashboards)
 * has been retired as part of Sprint 2. The application entry point is the
 * single shared login page; authenticated users are then routed to their
 * role-based landing page.
 */
export default function HomePage() {
  redirect('/login');
}
