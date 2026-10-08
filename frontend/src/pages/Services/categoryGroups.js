import {
  FaThLarge,
  FaHome,
  FaTools,
  FaBroom,
  FaUserAlt,
  FaBookOpen,
  FaCarSide,
  FaGlassCheers,
  FaHammer,
  FaEllipsisH,
} from 'react-icons/fa';

// Broad groupings sitting above the catalogue's own categories — a browsing
// shortcut, not a replacement for the DB categories the sidebar filters on.
// `match` is tested case-insensitively against a service's category name.
//
// Kept out of CategoryTabs.jsx so that file only exports its component,
// which is what React Fast Refresh needs to hot-reload it cleanly.
export const CATEGORY_GROUPS = [
  { key: 'all', label: 'All Services', icon: FaThLarge, match: null },
  { key: 'home-care', label: 'Home Care', icon: FaHome, match: ['home', 'garden', 'pest'] },
  { key: 'repairs', label: 'Repairs', icon: FaTools, match: ['repair', 'plumb', 'electric', 'ac'] },
  { key: 'cleaning', label: 'Cleaning', icon: FaBroom, match: ['clean'] },
  { key: 'personal-care', label: 'Personal Care', icon: FaUserAlt, match: ['salon', 'beauty', 'care'] },
  { key: 'education', label: 'Education', icon: FaBookOpen, match: ['tutor', 'educat', 'class'] },
  { key: 'automotive', label: 'Automotive', icon: FaCarSide, match: ['mechanic', 'auto', 'vehicle'] },
  { key: 'events', label: 'Events', icon: FaGlassCheers, match: ['event', 'photo', 'cater'] },
  { key: 'home-improvement', label: 'Home Improvement', icon: FaHammer, match: ['carpent', 'paint', 'mason'] },
  { key: 'more', label: 'More', icon: FaEllipsisH, match: null },
];

export default CATEGORY_GROUPS;
