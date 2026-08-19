import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaMapMarkerAlt,
  FaBriefcase,
  FaCheckCircle,
} from "react-icons/fa";
import { formatCurrency } from "../../utils/formatCurrency";

const renderStars = (rating = 0) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<FaStar key={i} className="text-accent" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="text-accent" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-slate-300" />);
    }
  }
  return stars;
};

const AVAILABILITY_STYLES = {
  available: {
    label: "Available Today",
    dot: "bg-success",
    text: "text-success",
    bg: "bg-emerald-50",
  },
  busy: {
    label: "Busy",
    dot: "bg-accent",
    text: "text-accent",
    bg: "bg-amber-50",
  },
  offline: {
    label: "Unavailable",
    dot: "bg-slate-400",
    text: "text-slate-500",
    bg: "bg-slate-100",
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

const ProviderCard = ({ provider, index = 0, onBookNow }) => {
  const {
    _id,
    id,
    name,
    avatar,
    profession,
    category,
    rating = 0,
    reviewCount = 0,
    yearsExperience = 0,
    location,
    availability = "offline",
    startingPrice,
    description,
    isVerified,
  } = provider;

  const providerId = _id || id;
  const providerName =
    typeof provider === "string"
      ? provider
      : provider?.user
      ? `${provider.user.firstName || ""} ${provider.user.lastName || ""}`.trim() || "Unknown Pro"
      : name || "Unknown Pro";
  const availabilityInfo =
    AVAILABILITY_STYLES[availability] || AVAILABILITY_STYLES.offline;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={cardVariants}
      whileHover={{ y: -6 }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-slate-100 transition-shadow duration-300 hover:shadow-xl"
    >
      {/* Header: avatar + name + verified */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <img
            src={avatar || "/images/avatar-placeholder.jpg"}
            alt={name}
            loading="lazy"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
          />
          {isVerified && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary shadow">
              <FaCheckCircle size={14} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-secondary">
              {providerName}
            </h3>
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {profession}
          </p>
          <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-primary">
            {typeof category === "string" ? category : category?.name || "Uncategorized"}
          </span>
        </div>
      </div>

      {/* Rating + experience */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">{renderStars(rating)}</div>
          <span className="ml-1 font-medium text-secondary">
            {rating.toFixed(1)}
          </span>
          <span className="text-slate-400">({reviewCount})</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <FaBriefcase className="text-primary" size={12} />
          <span>{yearsExperience}+ yrs</span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
        {description}
      </p>

      {/* Location + availability */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-1 text-slate-500">
          <FaMapMarkerAlt className="text-primary" size={12} />
          <span className="line-clamp-1 max-w-[140px]">{location}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${availabilityInfo.bg} ${availabilityInfo.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${availabilityInfo.dot}`} />
          {availabilityInfo.label}
        </span>
      </div>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1.5 border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-400">Starting at</span>
        <span className="text-base font-bold text-primary">
          {formatCurrency(startingPrice)}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3">
        <Link
          to={`/providers/${providerId}`}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          View Profile
        </Link>
        <button
          type="button"
          onClick={() => onBookNow?.(provider)}
          className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
        >
          Book Now
        </button>
      </div>
    </motion.div>
  );
};

export default memo(ProviderCard);