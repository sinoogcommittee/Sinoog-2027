import { Home } from 'lucide-react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../features/ui/FeedbackStates';

export function NotFoundPage() {
  return (
    <main className="m3-not-found-page">
      <section className="section" style={{ minHeight: '65vh', display: 'grid', placeItems: 'center' }}>
        <div className="container" style={{ maxWidth: '480px' }}>
          <EmptyState
            title="Page not found"
            message="The page you requested may have moved, been renamed, or is not yet published."
            action={
              <Button to="/" variant="filled" leadingIcon={<Home size={18} aria-hidden />}>
                Return home
              </Button>
            }
          />
        </div>
      </section>
    </main>
  );
}
