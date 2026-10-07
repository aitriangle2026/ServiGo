import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaBriefcase, FaComments, FaPhone } from 'react-icons/fa';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/common/Button';
import { providerService } from '@/services/providerService';
import { serviceService } from '@/services/serviceService';
import { reviewService } from '@/services/reviewService';
import { chatService } from '@/services/chatService';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { startCall } = useCall();

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    providerService
      .getById(id)
      .then((res) => setProvider(res?.data ?? res))
      .catch(() => setError('Could not load this provider.'))
      .finally(() => setIsLoading(false));

    serviceService
      .search({ provider: id })
      .then((res) => setServices(res?.data || []))
      .catch(() => setServices([]));

    reviewService
      .getByProvider(id)
      .then((res) => setReviews(res?.data || []))
      .catch(() => setReviews([]));
  }, [id]);

  const providerName = provider?.user
    ? `${provider.user.firstName || ''} ${provider.user.lastName || ''}`.trim()
    : 'Unknown Pro';
  const location = provider?.workingArea?.city || provider?.workingArea?.district || '';
  const isOwnProfile = !!(user && provider?.user?._id && String(provider.user._id) === String(user._id || user.id));

  const goToChat = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setError('');
    setIsStartingChat(true);
    try {
      const { data } = await chatService.startConversation({ providerId: id });
      navigate(`/messages/${data._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not start a conversation with this provider.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleCall = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!provider?.user?._id) return;
    startCall(
      { userId: provider.user._id, name: providerName, avatar: provider.profileImage },
      null
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-text-muted">Loading…</div>
      </div>
    );
  }

  if (error && !provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-danger">{error}</p>
          <Link to="/find-pros" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            ← Back to providers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/find-pros" className="mb-6 inline-block text-sm font-semibold text-primary hover:underline">
          ← Back to providers
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <img
                src={
                  provider?.profileImage ||
                  `https://ui-avatars.com/api/?name=${providerName}&background=EFF6FF&color=2563EB`
                }
                alt=""
                className="mx-auto h-24 w-24 rounded-full object-cover"
              />
              <h1 className="mt-4 font-display text-xl font-extrabold text-secondary">{providerName}</h1>
              {provider?.isVerified && (
                <span className="mt-1 inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                  Verified provider
                </span>
              )}

              <div className="mt-3 flex items-center justify-center gap-1.5 text-sm">
                <FaStar className="text-accent" />
                <span className="font-semibold text-secondary">{(provider?.averageRating || 0).toFixed(1)}</span>
                <span className="text-text-muted">({provider?.totalReviews || 0} reviews)</span>
              </div>

              {location && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-text-muted">
                  <FaMapMarkerAlt size={12} /> {location}
                  {provider?.workingArea?.country ? `, ${provider.workingArea.country}` : ''}
                </p>
              )}
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-text-muted">
                <FaBriefcase size={12} /> {provider?.experience || 0} years experience
              </p>

              {error && <p className="mt-3 text-xs text-danger">{error}</p>}

              {!isOwnProfile && (
                <div className="mt-5 flex gap-2">
                  <Button variant="primary" fullWidth isLoading={isStartingChat} onClick={goToChat}>
                    <FaComments size={13} className="mr-1.5" /> Message
                  </Button>
                  <Button variant="outline" onClick={handleCall} aria-label="Call">
                    <FaPhone size={13} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {provider?.bio && (
              <div className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-display text-base font-bold text-secondary">About</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{provider.bio}</p>
              </div>
            )}

            {services.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display text-base font-bold text-secondary">Services</h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {services.map((s) => (
                    <Link
                      key={s._id}
                      to={`/services/${s._id}`}
                      className="rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-soft"
                    >
                      <img
                        src={s.images?.[0] || '/images/service-placeholder.jpg'}
                        alt=""
                        className="mb-3 h-28 w-full rounded-xl object-cover"
                      />
                      <p className="text-sm font-semibold text-secondary">{s.title}</p>
                      <p className="mt-1 text-sm font-bold text-primary">
                        {formatCurrency(s.price)}
                        {s.priceType === 'hourly' && <span className="text-xs font-medium text-text-muted"> /hr</span>}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display text-base font-bold text-secondary">Reviews ({reviews.length})</h3>
                <div className="mt-3 space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="rounded-2xl border border-border bg-surface p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-secondary">
                          {r.customer?.firstName} {r.customer?.lastName}
                        </p>
                        <div className="flex gap-0.5 text-accent">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar key={i} className={i < r.rating ? 'text-accent' : 'text-slate-200'} />
                          ))}
                        </div>
                      </div>
                      {r.review && <p className="mt-2 text-sm text-text-muted">{r.review}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}