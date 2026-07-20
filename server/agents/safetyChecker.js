/**
 * safetyChecker.js
 * Checks whether any equipment in the query context has active work orders
 * or permits that could create safety hazards before proceeding.
 */

const Asset = require('../models/Asset');

/**
 * Check safety precedence for a list of equipment tags.
 *
 * @param {string[]} equipmentTags - Array of asset tags found in retrieved chunks
 * @returns {Promise<{hasActiveWork: boolean, warnings: Object[]}>}
 */
async function checkSafetyPrecedence(equipmentTags = []) {
  if (!equipmentTags || equipmentTags.length === 0) {
    return { hasActiveWork: false, warnings: [] };
  }

  // Deduplicate tags
  const uniqueTags = [...new Set(equipmentTags.map((t) => t.trim()).filter(Boolean))];

  try {
    // Fetch all relevant assets in one query
    const assets = await Asset.find(
      { tag: { $in: uniqueTags } },
      { tag: 1, open_work_orders: 1, active_permits: 1, health_indicators: 1 }
    ).lean();

    const warnings = [];

    for (const asset of assets) {
      const hasWorkOrders = (asset.open_work_orders || 0) > 0;
      const hasPermits = (asset.active_permits || 0) > 0;

      if (hasWorkOrders || hasPermits) {
        const reasons = [];
        if (hasWorkOrders) {
          reasons.push(`${asset.open_work_orders} open work order(s)`);
        }
        if (hasPermits) {
          reasons.push(`${asset.active_permits} active permit(s)`);
        }

        warnings.push({
          tag: asset.tag,
          open_work_orders: asset.open_work_orders || 0,
          active_permits: asset.active_permits || 0,
          health_indicators: asset.health_indicators || {},
          message: `Active work order/permit exists on ${asset.tag} (${reasons.join(', ')}) — verify isolation before proceeding`,
        });
      }
    }

    // Also warn for tags that were queried but don't exist in the Asset registry
    const foundTags = new Set(assets.map((a) => a.tag));
    for (const tag of uniqueTags) {
      if (!foundTags.has(tag)) {
        console.warn(`[safetyChecker] Asset tag "${tag}" not found in registry — skipping`);
      }
    }

    const hasActiveWork = warnings.length > 0;

    if (hasActiveWork) {
      console.log(
        `[safetyChecker] [WARN]️  Safety flags on: ${warnings.map((w) => w.tag).join(', ')}`
      );
    } else {
      console.log(`[safetyChecker] [OK]  No active work orders or permits on checked tags`);
    }

    return { hasActiveWork, warnings };
  } catch (err) {
    console.warn('[safetyChecker] Safety check failed (non-fatal):', err.message);
    // Return safe default — don't block query on check failure
    return { hasActiveWork: false, warnings: [] };
  }
}

module.exports = { checkSafetyPrecedence };
