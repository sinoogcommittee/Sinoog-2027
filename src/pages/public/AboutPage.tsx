import { Facebook, MapPin } from 'lucide-react';
import { Button } from '../../components/Button';
import { PageHero } from '../../components/PageHero';
import { Card } from '../../components/m3/Card';

export function AboutPage() {
  return (
    <main className="m3-about-page">
      <PageHero
        eyebrow="Our parish community"
        title="About Sinoog 2027"
        description="Organized by the Sinoog Committee of Sto. Niño Parish — Guinacot, Guindulman, Bohol."
      />
      <section className="section">
        <div className="container split-feature">
          <Card as="div" variant="outlined" className="about-content-card">
            <h2>A celebration centered on the Holy Child</h2>
            <p>
              Sinoog gathers the parish and neighboring communities for worship, fellowship, cultural expression, and
              joyful service.
            </p>
            <p>More history and committee information will be added after parish review.</p>
            <div className="about-actions" style={{ marginTop: '1.5rem' }}>
              <Button
                to="https://www.facebook.com/Sto.NinoParishGuinacot"
                variant="outlined"
                leadingIcon={<Facebook size={18} aria-hidden />}
              >
                Visit parish Facebook
              </Button>
            </div>
          </Card>

          <div className="parish-map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3932.4016530129584!2d124.45346527408904!3d9.732003590360158!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aa0b0701b97f05%3A0x68fff2cb8e8183a1!2sSto.%20Ni%C3%B1o%20Parish%20-%20Guinacot%2C%20Guindulman%2C%20Bohol!5e0!3m2!1sen!2sph!4v1792984627890!5m2!1sen!2sph"
              title="Map of Sto. Niño Parish — Guinacot"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="parish-map__caption">
              <MapPin size={18} aria-hidden />
              <span>
                <strong>Sto. Niño Parish</strong>
                <small>Guinacot, Guindulman, Bohol</small>
              </span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Sto.%20Ni%C3%B1o%20Parish%20Guinacot%20Guindulman%20Bohol"
                target="_blank"
                rel="noreferrer"
              >
                Open map
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
