type Props = { type: 'parish' | 'committee'; className?: string };

export function LogoMark({ type, className = '' }: Props) {
  const parish = type === 'parish';
  return <img
    className={`logo-mark logo-mark--${type} ${className}`.trim()}
    src={parish ? '/images/parish_logo.webp' : '/images/committee_logo.webp'}
    alt={parish ? 'Sto. Niño Parish — Guinacot logo' : 'Sinoog Festival Committee logo'}
    width={parish ? 512 : 124}
    height={parish ? 512 : 91}
  />;
}
