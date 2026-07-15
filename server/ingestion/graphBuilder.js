/**
 * Stage 4 — Knowledge Graph Builder
 * Upserts Asset documents and creates relationship edges from extracted entities.
 */

const Asset = require('../models/Asset');

/**
 * Infer asset type from ISA tag prefix.
 * Common ISA prefixes: P=Pump, HX=HeatExchanger, RV=ReliefValve, V=Vessel, etc.
 */
function inferAssetType(tag) {
  const prefix = tag.replace(/[-_]?\d.*$/, '').toUpperCase();
  const typeMap = {
    P: 'Pump',
    HX: 'Heat Exchanger',
    RV: 'Relief Valve',
    V: 'Vessel',
    C: 'Compressor',
    T: 'Tower',
    E: 'Exchanger',
    F: 'Filter',
    TK: 'Tank',
    R: 'Reactor',
    D: 'Drum',
    FCV: 'Flow Control Valve',
    PCV: 'Pressure Control Valve',
    TCV: 'Temperature Control Valve',
    LCV: 'Level Control Valve',
    PSV: 'Pressure Safety Valve',
    XV: 'Shutdown Valve',
    FI: 'Flow Indicator',
    PI: 'Pressure Indicator',
    TI: 'Temperature Indicator',
    LI: 'Level Indicator',
  };
  return typeMap[prefix] || 'Equipment';
}

/**
 * Build / update the knowledge graph from extracted entities.
 * @param {Object} entities - Extracted entities from Stage 2
 * @param {string[]} entities.equipment_tags
 * @param {Array<{source: string, target: string, type: string}>} entities.relationships
 * @param {string} docId - MongoDB document ID
 * @returns {Promise<{assetsUpserted: number, edgesCreated: number}>}
 */
async function buildGraph(entities, docId) {
  console.log(
    `[graph-builder] Starting graph build — ` +
    `tags: ${entities.equipment_tags?.length || 0}, ` +
    `relationships: ${entities.relationships?.length || 0}`
  );

  let assetsUpserted = 0;
  let edgesCreated = 0;

  try {
    const tags = entities.equipment_tags || [];
    const relationships = entities.relationships || [];

    // --- Upsert Asset documents for each equipment tag ---
    for (const tag of tags) {
      try {
        const assetType = inferAssetType(tag);

        await Asset.findOneAndUpdate(
          { tag },
          {
            $setOnInsert: {
              tag,
              name: `${assetType} ${tag}`,
              asset_type: assetType,
              created_at: new Date(),
            },
          },
          { upsert: true, new: true }
        );

        assetsUpserted++;
      } catch (upsertErr) {
        console.warn(`[graph-builder] Failed to upsert asset "${tag}": ${upsertErr.message}`);
      }
    }

    console.log(`[graph-builder] Upserted ${assetsUpserted} assets`);

    // --- Create relationship edges ---
    for (const rel of relationships) {
      try {
        if (!rel.source || !rel.target || !rel.type) {
          continue;
        }

        // Ensure both source and target assets exist
        await Asset.findOneAndUpdate(
          { tag: rel.source },
          {
            $setOnInsert: {
              tag: rel.source,
              name: `${inferAssetType(rel.source)} ${rel.source}`,
              asset_type: inferAssetType(rel.source),
              created_at: new Date(),
            },
          },
          { upsert: true }
        );

        await Asset.findOneAndUpdate(
          { tag: rel.target },
          {
            $setOnInsert: {
              tag: rel.target,
              name: `${inferAssetType(rel.target)} ${rel.target}`,
              asset_type: inferAssetType(rel.target),
              created_at: new Date(),
            },
          },
          { upsert: true }
        );

        // Push relationship to source asset (avoid duplicates)
        const updateResult = await Asset.findOneAndUpdate(
          {
            tag: rel.source,
            'relationships.target_tag': { $ne: rel.target },
          },
          {
            $push: {
              relationships: {
                target_tag: rel.target,
                type: rel.type,
                confidence: 1.0,
                source_doc_id: docId,
                inferred_by: 'llm',
              },
            },
          }
        );

        // Also check if same target but different type — add if relationship type differs
        if (!updateResult) {
          await Asset.findOneAndUpdate(
            {
              tag: rel.source,
              relationships: {
                $not: {
                  $elemMatch: {
                    target_tag: rel.target,
                    type: rel.type,
                  },
                },
              },
            },
            {
              $push: {
                relationships: {
                  target_tag: rel.target,
                  type: rel.type,
                  confidence: 1.0,
                  source_doc_id: docId,
                  inferred_by: 'llm',
                },
              },
            }
          );
        }

        edgesCreated++;
      } catch (relErr) {
        console.warn(`[graph-builder] Failed to create edge ${rel.source} → ${rel.target}: ${relErr.message}`);
      }
    }

    console.log(`[graph-builder] Created ${edgesCreated} edges`);

    // --- Update knowledge_completeness for all affected assets ---
    for (const tag of tags) {
      try {
        // Count documents that reference this asset
        const Document = require('../models/Document');
        const docCount = await Document.countDocuments({ equipment_tags: tag });
        const completeness = Math.min(docCount / 15, 1.0);

        await Asset.findOneAndUpdate(
          { tag },
          {
            knowledge_completeness: completeness,
            $inc: { graph_edges_created: edgesCreated },
          }
        );
      } catch (kcErr) {
        console.warn(`[graph-builder] Failed to update completeness for "${tag}": ${kcErr.message}`);
      }
    }

    console.log(`[graph-builder] Graph build complete — ${assetsUpserted} assets, ${edgesCreated} edges`);
    return { assetsUpserted, edgesCreated };
  } catch (error) {
    console.error(`[graph-builder] Fatal error: ${error.message}`);
    throw new Error(`Graph building failed: ${error.message}`);
  }
}

module.exports = { buildGraph };
