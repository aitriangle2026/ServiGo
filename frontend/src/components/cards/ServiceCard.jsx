import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaMapMarkerAlt,
  FaTag,
} from "react-icons/fa";
import { formatCurrency } from "../../utils/formatCurrency";
import { useState } from "react";
import BookingForm from "../forms/BookingForm";

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

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

const ServiceCard = ({ service, index = 0 }) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const {
    _id,
    id,
    title,
    images,
    provider,
    category,
    price,
    averageRating: rating = 0,
    totalReviews: reviewCount = 0,
    location,
    description,
  } = service;

  const image = images && images.length > 0 ? images[0] : null;

  const serviceId = _id || id;

  const providerName =
    typeof provider === "string"
      ? provider
      : provider?.user
        ? `${provider.user.firstName || ""} ${provider.user.lastName || ""}`.trim() || "Unknown Pro"
        : provider?.name || "Unknown Pro";
        
  return (
    <>
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={cardVariants}
      whileHover={{ y: -6 }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-slate-100 transition-shadow duration-300 hover:shadow-xl"
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={image || "/images/service-placeholder.jpg"}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-secondary backdrop-blur-sm">
          <FaTag className="text-primary" size={10} />
          {typeof category === "string" ? category : category?.name || "Uncategorized"}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-secondary">
            {title}
          </h3>
          <span className="whitespace-nowrap text-base font-bold text-primary">
            {formatCurrency(price)}
          </span>
        </div>

        <p className="text-sm text-slate-500">by {providerName}</p>

        <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
          {description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 text-sm">
              {renderStars(rating)}
            </div>
            <span className="ml-1 font-medium text-secondary">
              {rating.toFixed(1)}
            </span>
            <span className="text-slate-400">({reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <FaMapMarkerAlt className="text-primary" size={12} />
            <span className="line-clamp-1 max-w-[100px]">{location}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-3 border-t border-slate-100 pt-4">
          <Link
            to={`/services/${serviceId}`}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={() => setIsBookingOpen(true)}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.div>

    {isBookingOpen && (
      <BookingForm service={service} isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    )}
    </>
  );
};

export default memo(ServiceCard);