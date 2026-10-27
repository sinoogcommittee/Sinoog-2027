import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHero } from '../../components/PageHero';
import { getCurrentEdition, getSiteSettings, type SiteSettingsMap } from '../../features/editions/editionQueries';
import { toSafeHttpUrl } from '../../lib/safeUrl';

const EFFECTIVE_DATE = 'October 28, 2026';
const OFFICIAL_FACEBOOK = 'https://www.facebook.com/Sto.NinoParishGuinacot';

export function PolicyPage({ type }: { type: 'privacy' | 'terms' }) {
  const privacy = type === 'privacy';
  const [contact, setContact] = useState<SiteSettingsMap['contact_info']>();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const edition = await getCurrentEdition();
        const settings = await getSiteSettings(edition.id);
        if (active) setContact(settings.contact_info);
      } catch {
        // The official Facebook page remains available as the fallback contact.
      }
    })();
    return () => { active = false; };
  }, []);

  const support = (
    <>
      {contact?.email && <li>Email: <a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
      {contact?.phone && <li>Mobile: <a href={`tel:${contact.phone}`}>{contact.phone}</a></li>}
      {contact?.office_hours && <li>Office hours: {contact.office_hours}</li>}
      <li><a href={toSafeHttpUrl(contact?.social_fb) || OFFICIAL_FACEBOOK} target="_blank" rel="noreferrer">Official parish Facebook page</a></li>
    </>
  );

  return <>
    <PageHero eyebrow="Sinoog Run 2027" title={privacy ? 'Privacy notice' : 'Registration terms, waiver & refund policy'} description={privacy ? 'How the Sinoog Committee collects, uses, protects, and retains runner information.' : 'The participation agreement for every online and walk-in Sinoog Run registration.'}/>
    <section className="section"><article className="container narrow prose policy-document">
      <p><strong>Version 2027-v2</strong> · Effective {EFFECTIVE_DATE}</p>
      {privacy ? <>
        <h2>1. Who is responsible for your information</h2>
        <p>The Sinoog Committee of Sto. Niño Parish – Guinacot, Guindulman, Bohol manages the Sinoog Run 2027 registration system. This notice applies to runners, parents or guardians, emergency contacts, and people registered by an administrator.</p>
        <h2>2. Information we collect</h2>
        <p>We collect the runner’s account email, name, birth date, sex division, mobile number, full address, shirt size, club or team, emergency-contact details, medical or accessibility notes voluntarily provided for event safety, chosen category, payment method and evidence, consent records, bib and QR identifiers, and official start/finish results. Administrative actions record the responsible staff account and date.</p>
        <h2>3. Why we use it</h2>
        <p>Information is used to create and verify registrations, review payment, allocate kits and bibs, manage event capacity, contact runners, respond to emergencies, operate QR timing, prepare rankings and awards, investigate disputes, secure the website, and meet legitimate accounting and event-record requirements.</p>
        <h2>4. Who may access it</h2>
        <p>Only authorized committee members and service providers needed to operate the website may access the information required for their work. Contact details, emergency information, payment evidence, and QR tokens are not published. Public or event-day results may show the runner’s name, bib number, category, division, placement, and official time.</p>
        <h2>5. Children and guardian consent</h2>
        <p>A runner under 18 must register with the knowledge and consent of a parent or legal guardian. The guardian must review the participation waiver, authorize emergency assistance, and confirm that the information supplied for the minor is accurate.</p>
        <h2>6. Storage, security, and retention</h2>
        <p>Private payment evidence and account records are protected by access controls. Records are retained only while needed for registration, event operations, financial reconciliation, safety, audit, dispute resolution, and lawful recordkeeping. When no longer needed, private records are deleted or anonymized according to the committee’s approved retention process. Public race results may remain as part of the event archive.</p>
        <h2>7. Your choices and rights</h2>
        <p>You may ask to access or correct your information, object to or restrict certain processing, withdraw consent where consent is the basis, or request deletion when no overriding legal or operational reason requires retention. Withdrawing required registration consent before the race may prevent participation. Contact the committee so it can verify your identity and respond safely.</p>
        <h2>8. Support and privacy requests</h2>
        <p>For corrections, privacy questions, or account support, contact the Sinoog Committee through:</p><ul>{support}</ul>
        <p>See also the <Link to="/terms">registration terms, waiver, guardian consent, and refund policy</Link>.</p>
      </> : <>
        <h2>1. Registration and truthful information</h2>
        <p>The runner, or the parent or legal guardian of a minor runner, confirms that all submitted information is accurate and that the selected category is appropriate. Registration is not complete until the committee approves the entry. Approval also confirms the committee’s review of the submitted payment or recorded cash payment.</p>
        <h2>2. Fitness, risk, and event rules</h2>
        <p>Running and walking on public roads involve physical exertion and risks including falls, traffic, crowds, weather, dehydration, illness, and injury. The participant confirms that they are sufficiently fit for the selected category, will seek medical advice when appropriate, will follow the official route and safety instructions, and will stop or seek assistance if continuing is unsafe.</p>
        <h2>3. Assumption of risk and release</h2>
        <p>The participant voluntarily accepts the ordinary and reasonably foreseeable risks of the event and, to the extent permitted by law, releases Sto. Niño Parish – Guinacot, the Sinoog Committee, sponsors, partner agencies, officials, volunteers, and service providers from claims arising from those accepted risks. This does not waive rights that cannot legally be waived or excuse gross negligence or intentional misconduct.</p>
        <h2>4. Emergency assistance</h2>
        <p>The participant authorizes event personnel to provide first aid and arrange emergency transport or treatment when reasonably necessary. Any resulting medical cost remains the participant’s or guardian’s responsibility. The named emergency contact may be contacted for event safety.</p>
        <h2>5. Parent or guardian consent</h2>
        <p>For a participant under 18, the parent or legal guardian confirms authority to give consent, has reviewed this entire agreement, permits the minor to participate, accepts the listed risks on the minor’s behalf to the extent permitted by law, authorizes emergency assistance, and agrees to ensure the minor follows event instructions.</p>
        <h2>6. Event changes and documentation</h2>
        <p>The committee may adjust routes, schedules, categories, or safety procedures, or postpone or cancel activities when weather, public safety, government direction, or circumstances beyond its control require it. Event photographs and video may be used for parish documentation, news, and future Sinoog promotion; contact the committee about a specific safety or privacy concern.</p>
        <h2>7. Payment and refund policy</h2>
        <p>Registration fees support reserved kits and event operations and are generally non-refundable after submission or approval, including non-attendance, personal schedule changes, disqualification for rule violations, or a participant’s decision not to run. Duplicate payments or clear payment errors should be reported promptly and will be reviewed by the committee case by case. If the committee cancels the entire run, it will announce the applicable transfer, kit-release, or refund arrangement based on committed event costs. The website does not provide an automatic refund workflow.</p>
        <h2>8. Acceptance and records</h2>
        <p>Online acceptance records the policy version, runner account, and date. For a walk-in registration, the administrator confirms receipt of the signed paper agreement. The registration record separately shows when it was submitted and when it was approved.</p>
        <h2>9. Support contact</h2>
        <p>Questions about registration, payment corrections, or these terms may be sent to the Sinoog Committee through:</p><ul>{support}</ul>
        <p>Read the <Link to="/privacy">privacy notice</Link> for details about personal information.</p>
      </>}
    </article></section>
  </>;
}
