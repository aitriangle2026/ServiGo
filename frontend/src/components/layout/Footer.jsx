import { Link } from 'react-router-dom';
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
} from 'react-icons/fa';
import { APP_NAME } from '@/utils/constants';

const FOOTER_LINKS = [
  {
    heading: 'Company',
    links: [
      { label: 'About us', path: '/about' },
      { label: 'How it works', path: '/#how-it-works' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
    ],
  },
  {
    heading: 'For customers',
    links: [
      { label: 'Browse services', path: '/services' },
      { label: 'Find a pro', path: '/find-pros' },
      { label: 'Help center', path: '/faq' },
      { label: 'Trust & safety', path: '/trust-safety' },
    ],
  },
  {
    heading: 'For providers',
    links: [
      { label: 'Become a Pro', path: '/provider/onboarding' },
      { label: 'Provider resources', path: '/provider/resources' },
      { label: 'Success stories', path: '/success-stories' },
      { label: 'Provider app', path: '/provider/app' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of service', path: '/terms' },
      { label: 'Privacy policy', path: '/privacy' },
      { label: 'Cookie policy', path: '/cookies' },
    ],
  },
];

const Footer = () => (
  <footer className="bg-secondary text-slate-300">
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
              S
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              {APP_NAME}
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            The trusted way to find, book and manage local service professionals — from electricians
            to event planners, all verified and ready to work.
          </p>
          <div className="mt-6 space-y-2.5 text-sm text-slate-400">
            <p className="flex items-center gap-2.5">
              <FaMapMarkerAlt className="text-primary" /> 14 Duplication Road, Colombo 03, Sri Lanka
            </p>
            <p className="flex items-center gap-2.5">
              <FaPhoneAlt className="text-primary" /> +94 11 234 5678
            </p>
            <p className="flex items-center gap-2.5">
              <FaEnvelope className="text-primary" /> support@servigo.lk
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            {[FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social link"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-sm transition-colors hover:bg-primary hover:text-white"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.heading}>
            <h4 className="font-display text-sm font-semibold text-white">{col.heading}</h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
        <p className="text-xs text-slate-500">Built for the ServiGo Final Year Project.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
