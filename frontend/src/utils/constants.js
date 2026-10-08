import {
  FaBolt,
  FaWrench,
  FaHammer,
  FaSnowflake,
  FaCarSide,
  FaBroom,
  FaPaintRoller,
  FaLeaf,
  FaChalkboardTeacher,
  FaCamera,
  FaSpa,
  FaGlassCheers,
  FaTruckMoving,
  FaTools,
} from 'react-icons/fa';

export const APP_NAME = 'ServiGo';

export const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Services', path: '/services' },
  { label: 'Find Pros', path: '/find-pros' },
  { label: 'How it works', path: '/how-it-works' },
  { label: 'About', path: '/about' },
];

export const CATEGORIES = [
  { id: 'electrician', name: 'Electrician', icon: FaBolt, jobCount: 1240, color: '#F59E0B' },
  { id: 'plumber', name: 'Plumber', icon: FaWrench, jobCount: 980, color: '#2563EB' },
  { id: 'carpenter', name: 'Carpenter', icon: FaHammer, jobCount: 742, color: '#0F172A' },
  { id: 'ac-repair', name: 'AC Repair', icon: FaSnowflake, jobCount: 615, color: '#0EA5E9' },
  { id: 'mechanic', name: 'Mechanic', icon: FaCarSide, jobCount: 890, color: '#EF4444' },
  { id: 'cleaning', name: 'Cleaning', icon: FaBroom, jobCount: 1530, color: '#10B981' },
  { id: 'painting', name: 'Painting', icon: FaPaintRoller, jobCount: 528, color: '#F59E0B' },
  { id: 'gardening', name: 'Gardening', icon: FaLeaf, jobCount: 466, color: '#10B981' },
  { id: 'tutoring', name: 'Tutoring', icon: FaChalkboardTeacher, jobCount: 703, color: '#2563EB' },
  { id: 'photography', name: 'Photography', icon: FaCamera, jobCount: 384, color: '#0F172A' },
  { id: 'beauty', name: 'Beauty & Spa', icon: FaSpa, jobCount: 612, color: '#EC4899' },
  { id: 'events', name: 'Event Planning', icon: FaGlassCheers, jobCount: 297, color: '#F59E0B' },
  { id: 'movers', name: 'Movers & Packers', icon: FaTruckMoving, jobCount: 358, color: '#2563EB' },
  { id: 'appliance', name: 'Appliance Repair', icon: FaTools, jobCount: 501, color: '#64748B' },
];

export const FEATURED_SERVICES = [
  {
    id: 'srv-01',
    title: 'Full Home Deep Cleaning',
    category: 'Cleaning',
    providerName: 'SparkleWorks Colombo',
    providerAvatar: 'https://i.pravatar.cc/100?img=32',
    rating: 4.9,
    reviewCount: 312,
    price: 6500,
    priceUnit: 'per visit',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    verified: true,
  },
  {
    id: 'srv-02',
    title: 'Ceiling Fan & Wiring Repair',
    category: 'Electrician',
    providerName: 'Perera Electricals',
    providerAvatar: 'https://i.pravatar.cc/100?img=12',
    rating: 4.8,
    reviewCount: 187,
    price: 2200,
    priceUnit: 'starting price',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    verified: true,
  },
  {
    id: 'srv-03',
    title: 'Bathroom Leak & Pipe Fitting',
    category: 'Plumber',
    providerName: 'FlowFix Plumbing',
    providerAvatar: 'https://i.pravatar.cc/100?img=51',
    rating: 4.7,
    reviewCount: 145,
    price: 3000,
    priceUnit: 'starting price',
    image: 'https://images.unsplash.com/photo-1607472829122-8a7a0af6d4a1?w=800&q=80',
    verified: true,
  },
  {
    id: 'srv-04',
    title: 'Split AC Servicing & Gas Refill',
    category: 'AC Repair',
    providerName: 'CoolBreeze Technicians',
    providerAvatar: 'https://i.pravatar.cc/100?img=22',
    rating: 4.9,
    reviewCount: 264,
    price: 3500,
    priceUnit: 'per unit',
    image: 'https://images.unsplash.com/photo-1631545806609-355293f1f16d?w=800&q=80',
    verified: true,
  },
  {
    id: 'srv-05',
    title: 'Custom Wardrobe Carpentry',
    category: 'Carpenter',
    providerName: 'WoodCraft Studio',
    providerAvatar: 'https://i.pravatar.cc/100?img=15',
    rating: 4.8,
    reviewCount: 98,
    price: 18500,
    priceUnit: 'starting price',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    verified: true,
  },
  {
    id: 'srv-06',
    title: 'A/L Mathematics Home Tutoring',
    category: 'Tutoring',
    providerName: 'Nimal Fernando',
    providerAvatar: 'https://i.pravatar.cc/100?img=60',
    rating: 5.0,
    reviewCount: 56,
    price: 2000,
    priceUnit: 'per session',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
    verified: true,
  },
];

export const TOP_PROVIDERS = [
  {
    id: 'prv-01',
    name: 'Sunil Perera',
    profession: 'Master Electrician',
    avatar: 'https://i.pravatar.cc/150?img=12',
    rating: 4.9,
    reviewCount: 412,
    jobsCompleted: 860,
    location: 'Colombo 05',
    verified: true,
    responseTime: '~15 min',
  },
  {
    id: 'prv-02',
    name: 'Anusha Silva',
    profession: 'Home Cleaning Specialist',
    avatar: 'https://i.pravatar.cc/150?img=47',
    rating: 4.9,
    reviewCount: 358,
    jobsCompleted: 940,
    location: 'Negombo',
    verified: true,
    responseTime: '~10 min',
  },
  {
    id: 'prv-03',
    name: 'Kasun Jayasuriya',
    profession: 'Plumbing Contractor',
    avatar: 'https://i.pravatar.cc/150?img=33',
    rating: 4.8,
    reviewCount: 276,
    jobsCompleted: 610,
    location: 'Kandy',
    verified: true,
    responseTime: '~20 min',
  },
  {
    id: 'prv-04',
    name: 'Dilani Rathnayake',
    profession: 'Certified Makeup Artist',
    avatar: 'https://i.pravatar.cc/150?img=44',
    rating: 5.0,
    reviewCount: 203,
    jobsCompleted: 480,
    location: 'Colombo 03',
    verified: true,
    responseTime: '~30 min',
  },
];

export const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Ruwan Wickramasinghe',
    role: 'Homeowner, Battaramulla',
    avatar: 'https://i.pravatar.cc/100?img=68',
    rating: 5,
    text: "I booked an electrician at 9pm after a fuse blew, and someone verified showed up within the hour. ServiGo has genuinely replaced the family group chat asking if anyone knows a good handyman.",
  },
  {
    id: 't2',
    name: 'Ishara Gunasekara',
    role: 'Working Professional, Colombo 07',
    avatar: 'https://i.pravatar.cc/100?img=45',
    rating: 5,
    text: "The upfront pricing is what won me over. No haggling, no surprise call-out fees — I see the estimate, the reviews and the provider's past work before I ever pick up the phone.",
  },
  {
    id: 't3',
    name: 'Thilina Bandara',
    role: 'Small Business Owner, Kandy',
    avatar: 'https://i.pravatar.cc/100?img=51',
    rating: 4,
    text: 'We use ServiGo to manage repairs and cleaning across three shop locations now. Being able to track every booking and invoice from one dashboard has saved us hours every month.',
  },
];

export const FAQS = [
  {
    id: 'f1',
    question: 'How does ServiGo verify its service providers?',
    answer:
      "Every provider on ServiGo goes through an identity check, background screening and a skills review before they can accept bookings. Verified providers carry a blue checkmark badge, and their certifications are visible on their profile.",
  },
  {
    id: 'f2',
    question: 'How much does it cost to book a service?',
    answer:
      'Browsing and requesting quotes is always free. You only pay for the service you book, and the price is confirmed upfront before you confirm — no hidden call-out charges.',
  },
  {
    id: 'f3',
    question: "What if I'm not happy with the work?",
    answer:
      "Every booking is covered by the ServiGo Satisfaction Guarantee. If the job wasn't completed as agreed, contact support within 48 hours and we'll arrange a free re-service or a refund.",
  },
  {
    id: 'f4',
    question: 'Can I become a service provider on ServiGo?',
    answer:
      'Yes. Sign up for a provider account, complete verification, list your services and set your own availability and pricing. Most providers get their first booking within a week of approval.',
  },
  {
    id: 'f5',
    question: 'How do payments and refunds work?',
    answer:
      'You can pay securely by card or wallet at the time of booking. Funds are only released to the provider after you confirm the job is complete, and refunds for cancellations follow the policy shown at checkout.',
  },
];

export const STATS = [
  { id: 's1', label: 'Verified Providers', value: 8400, suffix: '+' },
  { id: 's2', label: 'Jobs Completed', value: 152000, suffix: '+' },
  { id: 's3', label: 'Cities Covered', value: 24, suffix: '' },
  { id: 's4', label: 'Average Rating', value: 4.8, suffix: '/5' },
];

export const HOW_IT_WORKS_STEPS = [
  {
    id: 'w1',
    title: 'Tell us what you need',
    description: 'Search a category or describe the job — from a leaking tap to a full home renovation.',
  },
  {
    id: 'w2',
    title: 'Compare verified pros',
    description: 'Review ratings, past work, pricing and availability side by side, then pick your favorite.',
  },
  {
    id: 'w3',
    title: 'Book in a few taps',
    description: "Choose a time slot, confirm the price and pay securely — no calls or back-and-forth needed.",
  },
  {
    id: 'w4',
    title: 'Get it done, rate it',
    description: "Your pro arrives on schedule. Once the job's done, leave a review to help the community.",
  },
];
