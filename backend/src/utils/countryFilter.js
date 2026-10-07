// Country matching for the marketplace's country-scoping rule: a customer
// in one country should only ever be matched with providers working in
// that same country.
//
// Country is stored as free text (User.preferredLocation.country,
// ProviderProfile.workingArea.country, JobRequest.location.country), so
// "sri lanka" and "Sri Lanka" are the same country as far as matching goes.
// An exact, case-insensitive, anchored match keeps that true without
// letting "Lanka" match "Sri Lanka" the way a loose $regex would.

const DEFAULT_COUNTRY = "Sri Lanka";

// User-supplied country text goes straight into a RegExp, so escape it —
// otherwise a country containing regex metacharacters would either throw
// or silently match the wrong set of documents.
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Builds a Mongo matcher for an exact (case-insensitive) country match.
 * Falls back to the same default the schemas use when nothing is supplied,
 * so a provider or request with no country set is still scoped somewhere
 * rather than matching everything.
 *
 * @param {string | null | undefined} country
 * @returns {RegExp} usable directly as a query value, e.g.
 *   `{ "location.country": countryEquals("Sri Lanka") }`
 */
const countryEquals = (country) => {
  const trimmed = (country || "").toString().trim() || DEFAULT_COUNTRY;
  return new RegExp(`^${escapeRegex(trimmed)}$`, "i");
};

/**
 * Plain boolean comparison of two country strings, for the cases where
 * there's no Mongo query involved (in-memory checks, guards).
 *
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 * @returns {boolean}
 */
const isSameCountry = (a, b) => {
  const normalize = (value) => (value || "").toString().trim().toLowerCase();
  const left = normalize(a) || DEFAULT_COUNTRY.toLowerCase();
  const right = normalize(b) || DEFAULT_COUNTRY.toLowerCase();
  return left === right;
};

const sameLocation = (customerLocation, targetLocation) => {
  const normalize = (value) => (value || "").toString().trim().toLowerCase();

  const customerCountry = normalize(customerLocation?.country);
  const targetCountry = normalize(targetLocation?.country);
  const customerCity = normalize(customerLocation?.city);
  const targetCity = normalize(targetLocation?.city);

  if (customerCountry && targetCountry && customerCountry !== targetCountry) {
    return false;
  }

  if (customerCity && targetCity && customerCity !== targetCity) {
    return false;
  }

  if (customerCity && targetCity) {
    return true;
  }

  if (customerCountry && targetCountry) {
    return true;
  }

  return false;
};

module.exports = {
  DEFAULT_COUNTRY,
  countryEquals,
  isSameCountry,
  sameLocation,
};
