// The 100-point provider verification rubric. Kept as one pure function so
// the exact same scoring logic runs on the backend (authoritative, used at
// submit-time and shown to admins) — nothing here should ever be
// duplicated/re-approximated on the frontend; the frontend just displays
// whatever this returns.
const CATEGORY_MAX = {
  identity: 20,
  selfie: 15,
  profilePhoto: 5,
  portfolio: 15,
  personalDetails: 15,
  location: 5,
  certificates: 5,
  payoutDetails: 10,
  accountVerification: 10,
};

const PASS_THRESHOLD = 80;

const calculateVerificationScore = (profile, user) => {
  const breakdown = [];

  // Identity document — 20. A passport only has one photo page, so its
  // front image alone earns the full 20 instead of needing a "back" too.
  let identity = 0;
  if (profile.nicNumber && profile.nicNumber.trim()) identity += 5;
  if (profile.documentType === "passport") {
    if (profile.nicFrontImage) identity += 15;
  } else {
    if (profile.nicFrontImage) identity += 8;
    if (profile.nicBackImage) identity += 7;
  }
  breakdown.push({
    key: "identity",
    label: "Identity document",
    earned: Math.min(identity, CATEGORY_MAX.identity),
    max: CATEGORY_MAX.identity,
  });

  // Selfie — 15
  breakdown.push({
    key: "selfie",
    label: "Selfie photo",
    earned: profile.selfieImage ? CATEGORY_MAX.selfie : 0,
    max: CATEGORY_MAX.selfie,
  });

  // Profile photo — 5
  breakdown.push({
    key: "profilePhoto",
    label: "Profile photo",
    earned: profile.profileImage ? CATEGORY_MAX.profilePhoto : 0,
    max: CATEGORY_MAX.profilePhoto,
  });

  // Previous work / portfolio — 15, scales with quantity
  const portfolioCount = (profile.portfolioImages || []).length;
  let portfolio = 0;
  if (portfolioCount >= 5) portfolio = 15;
  else if (portfolioCount >= 3) portfolio = 10;
  else if (portfolioCount >= 1) portfolio = 5;
  breakdown.push({
    key: "portfolio",
    label: "Previous work / portfolio",
    earned: portfolio,
    max: CATEGORY_MAX.portfolio,
    count: portfolioCount,
  });

  // Personal & professional details — 15
  let personal = 0;
  if ((profile.bio || "").trim().length >= 40) personal += 5;
  if ((profile.experience || 0) > 0) personal += 5;
  if ((profile.categories || []).length > 0) personal += 5;
  breakdown.push({
    key: "personalDetails",
    label: "Personal & professional details",
    earned: personal,
    max: CATEGORY_MAX.personalDetails,
  });

  // Working area / location — 5
  const location =
    profile.workingArea?.city?.trim() && profile.workingArea?.district?.trim() ? CATEGORY_MAX.location : 0;
  breakdown.push({
    key: "location",
    label: "Working area / location",
    earned: location,
    max: CATEGORY_MAX.location,
  });

  // Certificates / qualifications — 5
  const certificates = (profile.certificates || []).length > 0 ? CATEGORY_MAX.certificates : 0;
  breakdown.push({
    key: "certificates",
    label: "Certificates / qualifications",
    earned: certificates,
    max: CATEGORY_MAX.certificates,
  });

  // Payment method / payout details — 10
  let payout = 0;
  const pd = profile.payoutDetails || {};
  if (pd.bankName?.trim() && pd.accountNumber?.trim()) payout += 6;
  if (pd.accountHolderName?.trim()) payout += 4;
  breakdown.push({
    key: "payoutDetails",
    label: "Payment method",
    earned: payout,
    max: CATEGORY_MAX.payoutDetails,
  });

  // Account verification — 10
  let account = 0;
  if (user?.isEmailVerified) account += 5;
  if (user?.isPhoneVerified) account += 5;
  breakdown.push({
    key: "accountVerification",
    label: "Account verification",
    earned: account,
    max: CATEGORY_MAX.accountVerification,
  });

  const total = breakdown.reduce((sum, c) => sum + c.earned, 0);
  const maxTotal = breakdown.reduce((sum, c) => sum + c.max, 0);

  return { total, maxTotal, breakdown, passed: total >= PASS_THRESHOLD };
};

module.exports = { calculateVerificationScore, CATEGORY_MAX, PASS_THRESHOLD };