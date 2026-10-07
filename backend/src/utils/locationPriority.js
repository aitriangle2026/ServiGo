/**
 * Ranks a target location against a customer's saved location for search
 * result ordering. Lower number = higher priority (shown first).
 *
 *   0 = exact place match (same city, or same district)
 *   1 = same country, different/unknown place
 *   2 = everything else (different or unknown country, or no location info)
 *
 * This is a simple text-match tier, not a distance calculation — providers'
 * lat/long aren't populated by any UI yet, so a real "nearest first" sort
 * isn't possible until that exists. Swap this out for a $geoNear/aggregation
 * pipeline once geocoding is wired in.
 *
 * @param {{ city?: string, district?: string, country?: string } | null | undefined} customerLocation
 * @param {{ city?: string, district?: string, country?: string } | null | undefined} targetLocation
 * @returns {0 | 1 | 2}
 */
const getLocationPriority = (customerLocation, targetLocation) => {
  if (!customerLocation || !targetLocation) return 2;

  const norm = (value) => (value || "").toString().trim().toLowerCase();

  const customerCity = norm(customerLocation.city);
  const customerDistrict = norm(customerLocation.district);
  const customerCountry = norm(customerLocation.country);

  const targetCity = norm(targetLocation.city);
  const targetDistrict = norm(targetLocation.district);
  const targetCountry = norm(targetLocation.country);

  const isSamePlace =
    (customerCity && targetCity && customerCity === targetCity) ||
    (customerDistrict && targetDistrict && customerDistrict === targetDistrict);

  if (isSamePlace) return 0;

  const isSameCountry =
    customerCountry && targetCountry && customerCountry === targetCountry;

  if (isSameCountry) return 1;

  return 2;
};

/**
 * Stable-sorts a list of documents (already fetched from the DB) so that
 * ones matching the customer's saved location come first, then same-country
 * results, then everything else. Falls back to no-op (original order
 * preserved) when the customer has no saved location — Array.sort is
 * guaranteed stable in Node, so results already sorted by rating/price/etc.
 * keep that order within each priority tier.
 *
 * @param {Array<any>} items
 * @param {{ city?: string, district?: string, country?: string } | null | undefined} customerLocation
 * @param {(item: any) => { city?: string, district?: string, country?: string } | null | undefined} getLocationFromItem
 */
const sortByLocationPriority = (items, customerLocation, getLocationFromItem) => {
  if (!customerLocation) return items;

  return [...items].sort((a, b) => {
    const priorityA = getLocationPriority(customerLocation, getLocationFromItem(a));
    const priorityB = getLocationPriority(customerLocation, getLocationFromItem(b));
    return priorityA - priorityB;
  });
};

module.exports = {
  getLocationPriority,
  sortByLocationPriority,
};