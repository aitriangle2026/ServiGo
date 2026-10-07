import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaIdCard,
  FaCamera,
  FaUserCircle,
  FaImages,
  FaUserEdit,
  FaMapMarkerAlt,
  FaCertificate,
  FaMoneyBillWave,
  FaShieldAlt,
  FaCheck,
  FaTrash,
  FaPaperPlane,
  FaTimesCircle,
  FaHourglassHalf,
  FaTrophy,
} from 'react-icons/fa';
import ProviderLayout from '@/layouts/ProviderLayout';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ScoreRing from '@/components/verification/ScoreRing';
import CategoryCard from '@/components/verification/CategoryCard';
import ConfettiBurst from '@/components/verification/ConfettiBurst';
import { providerService } from '@/services/providerService';
import { serviceService } from '@/services/serviceService';

const ICONS = {
  identity: FaIdCard,
  selfie: FaCamera,
  profilePhoto: FaUserCircle,
  portfolio: FaImages,
  personalDetails: FaUserEdit,
  location: FaMapMarkerAlt,
  certificates: FaCertificate,
  payoutDetails: FaMoneyBillWave,
  accountVerification: FaShieldAlt,
};

const fileInputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary';

export default function ProviderVerification() {
  const [profile, setProfile] = useState(null);
  const [score, setScore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const wasPassedRef = useRef(false);

  // ---- Per-category form state, synced from the server after every save ----
  const [documentType, setDocumentType] = useState('nic');
  const [nicNumber, setNicNumber] = useState('');
  const [nicFront, setNicFront] = useState(null);
  const [nicBack, setNicBack] = useState(null);
  const [savingIdentity, setSavingIdentity] = useState(false);

  const [selfieFile, setSelfieFile] = useState(null);
  const [savingSelfie, setSavingSelfie] = useState(false);

  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [savingProfilePhoto, setSavingProfilePhoto] = useState(false);

  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [savingPortfolio, setSavingPortfolio] = useState(false);

  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [savingDetails, setSavingDetails] = useState(false);

  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);

  const [certTitle, setCertTitle] = useState('');
  const [certFile, setCertFile] = useState(null);
  const [savingCertificate, setSavingCertificate] = useState(false);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [branch, setBranch] = useState('');
  const [savingPayout, setSavingPayout] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await providerService.getVerificationScore();
      setProfile(data.profile);
      setScore(data.score);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load your verification status.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    serviceService
      .getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Re-sync the editable form fields whenever the server profile changes
  // (initial load, and after every successful save below).
  useEffect(() => {
    if (!profile) return;
    setDocumentType(profile.documentType || 'nic');
    setNicNumber(profile.nicNumber || '');
    setBio(profile.bio || '');
    setExperience(profile.experience ? String(profile.experience) : '');
    setSelectedCategoryIds((profile.categories || []).map((c) => (typeof c === 'string' ? c : c._id)));
    setCity(profile.workingArea?.city || '');
    setDistrict(profile.workingArea?.district || '');
    setBankName(profile.payoutDetails?.bankName || '');
    setAccountNumber(profile.payoutDetails?.accountNumber || '');
    setAccountHolderName(profile.payoutDetails?.accountHolderName || '');
    setBranch(profile.payoutDetails?.branch || '');
  }, [profile]);

  // Celebrate the moment the score first crosses 80 — not on every load.
  useEffect(() => {
    if (score?.passed && !wasPassedRef.current) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1300);
      wasPassedRef.current = true;
      return () => clearTimeout(t);
    }
    if (score) wasPassedRef.current = !!score.passed;
  }, [score]);

  const byKey = (key) => score?.breakdown.find((b) => b.key === key) || { earned: 0, max: 0 };

  const toggleCategory = (id) => {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  // ---- Save handlers ----

  const saveIdentity = async () => {
    setError('');
    setSavingIdentity(true);
    try {
      await providerService.updateProfile({ documentType, nicNumber });
      if (nicFront || nicBack) {
        await providerService.uploadNicImages({ nicFrontImage: nicFront, nicBackImage: nicBack });
      }
      setNicFront(null);
      setNicBack(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save your identity document.');
    } finally {
      setSavingIdentity(false);
    }
  };

  const saveSelfie = async () => {
    if (!selfieFile) return;
    setError('');
    setSavingSelfie(true);
    try {
      await providerService.uploadSelfieImage(selfieFile);
      setSelfieFile(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not upload your selfie.');
    } finally {
      setSavingSelfie(false);
    }
  };

  const saveProfilePhoto = async () => {
    if (!profilePhotoFile) return;
    setError('');
    setSavingProfilePhoto(true);
    try {
      await providerService.uploadProfileImage(profilePhotoFile);
      setProfilePhotoFile(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not upload your profile photo.');
    } finally {
      setSavingProfilePhoto(false);
    }
  };

  const savePortfolio = async () => {
    if (portfolioFiles.length === 0) return;
    setError('');
    setSavingPortfolio(true);
    try {
      await providerService.addPortfolioImages(portfolioFiles);
      setPortfolioFiles([]);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not upload those photos.');
    } finally {
      setSavingPortfolio(false);
    }
  };

  const removePortfolioImage = async (url) => {
    setError('');
    try {
      await providerService.removePortfolioImage(url);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not remove that photo.');
    }
  };

  const saveDetails = async () => {
    setError('');
    setSavingDetails(true);
    try {
      await providerService.updateProfile({
        bio,
        experience: Number(experience) || 0,
        categories: selectedCategoryIds,
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save your details.');
    } finally {
      setSavingDetails(false);
    }
  };

  const saveLocation = async () => {
    setError('');
    setSavingLocation(true);
    try {
      // Merge onto the existing workingArea so address/radius/coordinates
      // already set elsewhere aren't wiped by this partial update.
      await providerService.updateProfile({
        workingArea: { ...profile.workingArea, city, district },
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save your location.');
    } finally {
      setSavingLocation(false);
    }
  };

  const saveCertificate = async () => {
    if (!certTitle.trim() || !certFile) return;
    setError('');
    setSavingCertificate(true);
    try {
      await providerService.addCertificate({ title: certTitle.trim(), file: certFile });
      setCertTitle('');
      setCertFile(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not add that certificate.');
    } finally {
      setSavingCertificate(false);
    }
  };

  const removeCertificate = async (id) => {
    setError('');
    try {
      await providerService.removeCertificate(id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not remove that certificate.');
    }
  };

  const savePayout = async () => {
    setError('');
    setSavingPayout(true);
    try {
      await providerService.updatePayoutDetails({ bankName, accountNumber, accountHolderName, branch });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save your payout details.');
    } finally {
      setSavingPayout(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await providerService.submitForReview();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit for review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProviderLayout title="Verification">
        <p className="text-sm text-text-muted">Loading…</p>
      </ProviderLayout>
    );
  }

  if (error && !profile) {
    return (
      <ProviderLayout title="Verification">
        <p className="rounded-xl border border-danger/20 bg-danger-light p-4 text-sm text-danger">{error}</p>
      </ProviderLayout>
    );
  }

  const status = profile?.verificationStatus;

  // ---- Already submitted / decided states ----

  if (status === 'pending') {
    return (
      <ProviderLayout title="Verification">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent-light text-accent">
            <FaHourglassHalf size={26} />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-secondary">Waiting for admin review</h2>
          <p className="mt-2 text-sm text-text-muted">
            You submitted your verification with a score of <strong>{profile.verificationScore}/100</strong>. An
            admin will review it and you'll be notified once they've made a decision.
          </p>
        </div>
      </ProviderLayout>
    );
  }

  if (status === 'approved') {
    return (
      <ProviderLayout title="Verification">
        <div className="mx-auto max-w-md rounded-2xl border border-success/30 bg-success-light p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success text-white"
          >
            <FaTrophy size={26} />
          </motion.div>
          <h2 className="mt-4 font-display text-xl font-bold text-secondary">You're verified!</h2>
          <p className="mt-2 text-sm text-text-muted">
            Your profile is live — customers can now find and book you on ServiGo.
          </p>
        </div>
      </ProviderLayout>
    );
  }

  // ---- Draft / rejected: show the checklist ----

  return (
    <ProviderLayout title="Verification">
      {status === 'rejected' && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger-light p-4 text-sm text-danger">
          <FaTimesCircle className="shrink-0" />
          <p>Your previous submission was rejected. Update your details below and submit again.</p>
        </div>
      )}

      <div className="relative mb-8 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 sm:flex-row sm:justify-between">
        <AnimatePresence>{showConfetti && <ConfettiBurst />}</AnimatePresence>

        <div>
          <h2 className="font-display text-xl font-bold text-secondary">Verification checklist</h2>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Fill in each section below — your score updates live. Admins review every submission, but a higher
            score gives yours the best chance of a quick approval.
          </p>
        </div>

        <ScoreRing score={score?.total || 0} passThreshold={80} />
      </div>

      {error && <p className="mb-4 rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{error}</p>}

      <div className="space-y-3">
        {/* Identity document */}
        <CategoryCard icon={ICONS.identity} label="Identity document" earned={byKey('identity').earned} max={byKey('identity').max}>
          <div className="flex gap-2">
            {['nic', 'passport'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDocumentType(t)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  documentType === t ? 'border-primary bg-primary text-white' : 'border-border text-text-muted'
                }`}
              >
                {t === 'nic' ? 'National ID' : 'Passport'}
              </button>
            ))}
          </div>
          <Input
            label={documentType === 'passport' ? 'Passport number' : 'NIC number'}
            value={nicNumber}
            onChange={(e) => setNicNumber(e.target.value)}
          />
          <div className={`grid grid-cols-1 gap-3 ${documentType === 'nic' ? 'sm:grid-cols-2' : ''}`}>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-secondary">
                {documentType === 'passport' ? 'Passport photo page' : 'Front photo'}
              </label>
              <input type="file" accept="image/*" className={fileInputClass} onChange={(e) => setNicFront(e.target.files?.[0] || null)} />
              {profile.nicFrontImage && !nicFront && (
                <img src={profile.nicFrontImage} alt="" className="mt-2 h-16 w-24 rounded-lg border border-border object-cover" />
              )}
            </div>
            {documentType === 'nic' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">Back photo</label>
                <input type="file" accept="image/*" className={fileInputClass} onChange={(e) => setNicBack(e.target.files?.[0] || null)} />
                {profile.nicBackImage && !nicBack && (
                  <img src={profile.nicBackImage} alt="" className="mt-2 h-16 w-24 rounded-lg border border-border object-cover" />
                )}
              </div>
            )}
          </div>
          <Button size="sm" isLoading={savingIdentity} onClick={saveIdentity}>
            <FaCheck size={11} className="mr-1.5" /> Save
          </Button>
        </CategoryCard>

        {/* Selfie */}
        <CategoryCard icon={ICONS.selfie} label="Selfie photo" earned={byKey('selfie').earned} max={byKey('selfie').max}>
          <p className="text-xs text-text-muted">
            A clear photo of your face, taken now — shown next to your ID photo so an admin can visually confirm it's you.
          </p>
          <input type="file" accept="image/*" capture="user" className={fileInputClass} onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} />
          {profile.selfieImage && !selfieFile && (
            <img src={profile.selfieImage} alt="" className="h-20 w-20 rounded-full border border-border object-cover" />
          )}
          <Button size="sm" isLoading={savingSelfie} disabled={!selfieFile} onClick={saveSelfie}>
            <FaCheck size={11} className="mr-1.5" /> Save
          </Button>
        </CategoryCard>

        {/* Profile photo */}
        <CategoryCard icon={ICONS.profilePhoto} label="Profile photo" earned={byKey('profilePhoto').earned} max={byKey('profilePhoto').max}>
          <p className="text-xs text-text-muted">A professional photo customers will see on your public profile.</p>
          <input type="file" accept="image/*" className={fileInputClass} onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)} />
          {profile.profileImage && !profilePhotoFile && (
            <img src={profile.profileImage} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
          )}
          <Button size="sm" isLoading={savingProfilePhoto} disabled={!profilePhotoFile} onClick={saveProfilePhoto}>
            <FaCheck size={11} className="mr-1.5" /> Save
          </Button>
        </CategoryCard>

        {/* Portfolio */}
        <CategoryCard icon={ICONS.portfolio} label="Previous work / portfolio" earned={byKey('portfolio').earned} max={byKey('portfolio').max}>
          <p className="text-xs text-text-muted">Photos of jobs you've completed — the more you add, the more points this earns (up to 5 photos).</p>
          <input
            type="file"
            accept="image/*"
            multiple
            className={fileInputClass}
            onChange={(e) => setPortfolioFiles(Array.from(e.target.files || []))}
          />
          {profile.portfolioImages?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.portfolioImages.map((url) => (
                <div key={url} className="group relative">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => removePortfolioImage(url)}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <FaTimesCircle size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button size="sm" isLoading={savingPortfolio} disabled={portfolioFiles.length === 0} onClick={savePortfolio}>
            <FaCheck size={11} className="mr-1.5" /> Upload {portfolioFiles.length > 0 ? `(${portfolioFiles.length})` : ''}
          </Button>
        </CategoryCard>

        {/* Personal & professional details */}
        <CategoryCard
          icon={ICONS.personalDetails}
          label="Personal & professional details"
          earned={byKey('personalDetails').earned}
          max={byKey('personalDetails').max}
        >
          <textarea
            placeholder="Tell customers about yourself and your experience…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none"
          />
          <Input label="Years of experience" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat._id);
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => toggleCategory(cat._id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                    isSelected ? 'border-primary bg-primary text-white' : 'border-border text-text-muted hover:border-primary/40'
                  }`}
                >
                  {isSelected && <FaCheck size={11} />}
                  {cat.name}
                </button>
              );
            })}
          </div>
          <Button size="sm" isLoading={savingDetails} onClick={saveDetails}>
            <FaCheck size={11} className="mr-1.5" /> Save
          </Button>
        </CategoryCard>

        {/* Location */}
        <CategoryCard icon={ICONS.location} label="Working area / location" earned={byKey('location').earned} max={byKey('location').max}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>
          <Button size="sm" isLoading={savingLocation} onClick={saveLocation}>
            <FaCheck size={11} className="mr-1.5" /> Save
          </Button>
        </CategoryCard>

        {/* Certificates */}
        <CategoryCard icon={ICONS.certificates} label="Certificates / qualifications" earned={byKey('certificates').earned} max={byKey('certificates').max}>
          <p className="text-xs text-text-muted">Optional, but rewarded — trade certificates, training completions, licenses.</p>
          {profile.certificates?.length > 0 && (
            <div className="space-y-2">
              {profile.certificates.map((c) => (
                <div key={c._id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <a href={c.fileUrl} target="_blank" rel="noreferrer" className="truncate text-sm text-primary underline">
                    {c.title}
                  </a>
                  <button type="button" onClick={() => removeCertificate(c._id)} className="shrink-0 text-text-muted hover:text-danger">
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Input placeholder="Certificate title" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} />
          <input
            type="file"
            accept="image/*,.pdf"
            className={fileInputClass}
            onChange={(e) => setCertFile(e.target.files?.[0] || null)}
          />
          <Button size="sm" isLoading={savingCertificate} disabled={!certTitle.trim() || !certFile} onClick={saveCertificate}>
            <FaCheck size={11} className="mr-1.5" /> Add certificate
          </Button>
        </CategoryCard>

        {/* Payment method */}
        <CategoryCard icon={ICONS.payoutDetails} label="Payment method" earned={byKey('payoutDetails').earned} max={byKey('payoutDetails').max}>
          <p className="text-xs text-text-muted">
            Where ServiGo sends your payouts. Payment capture is still manual for now — this just tells the admin
            team where to send your earnings.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <Input label="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            <Input label="Account holder name" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} />
            <Input label="Branch (optional)" value={branch} onChange={(e) => setBranch(e.target.value)} />
          </div>
          <Button size="sm" isLoading={savingPayout} onClick={savePayout}>
            <FaCheck size={11} className="mr-1.5" /> Save
          </Button>
        </CategoryCard>

        {/* Account verification — read-only status */}
        <CategoryCard
          icon={ICONS.accountVerification}
          label="Account verification"
          earned={byKey('accountVerification').earned}
          max={byKey('accountVerification').max}
        >
          <p className="text-xs text-text-muted">These are verified automatically when you confirm your email and phone number.</p>
        </CategoryCard>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-text-muted">
          Current score: <span className="font-bold text-secondary">{score?.total || 0}/100</span>
          {!score?.passed && ' — you can submit anytime, but 80+ gives admins the clearest picture.'}
        </p>
        <Button variant="primary" size="lg" isLoading={isSubmitting} onClick={handleSubmit}>
          <FaPaperPlane size={13} className="mr-2" /> Submit for review
        </Button>
      </div>
    </ProviderLayout>
  );
}