/**
 * seedDemoData.js
 * Creates realistic demo data directly in MongoDB for NEXUS demo and testing:
 * - 3 Asset documents (P-101, HX-204, V-302)
 * - 2 FailureSignature documents (bearing_failure, tube_fouling)
 * - 2 ComplianceMapping documents (OISD-GDN-206, FactoryAct-Sec31)
 *
 * Usage: node scripts/seedDemoData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const Asset = require(path.join(__dirname, '../models/Asset'));
const FailureSignature = require(path.join(__dirname, '../models/FailureSignature'));
const ComplianceMapping = require(path.join(__dirname, '../models/ComplianceMapping'));
const { embedTexts } = require(path.join(__dirname, '../ingestion/embedder'));

async function seed() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀  NEXUS Demo Data Seeder`);
  console.log(`${'='.repeat(70)}\n`);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌  MONGODB_URI not found in environment variables (.env). Exiting.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅  Connected to MongoDB.\n');

    // -------------------------------------------------------------------------
    // 1. Seed Assets
    // -------------------------------------------------------------------------
    console.log('▶ Seeding 3 Asset documents...');

    const demoAssets = [
      {
        tag: 'P-101',
        name: 'Centrifugal Pump P-101',
        asset_type: 'Centrifugal Pump',
        plant_area: 'Unit-3',
        criticality: 'A',
        knowledge_completeness: 0.73,
        relationships: [
          {
            target_tag: 'HX-204',
            type: 'FEEDS_INTO',
            confidence: 1.0,
            inferred_by: 'manual',
          },
        ],
      },
      {
        tag: 'HX-204',
        name: 'Heat Exchanger HX-204',
        asset_type: 'Heat Exchanger',
        plant_area: 'Unit-3',
        criticality: 'A',
        knowledge_completeness: 0.45,
        relationships: [
          {
            target_tag: 'P-101',
            type: 'FED_BY',
            confidence: 1.0,
            inferred_by: 'manual',
          },
        ],
      },
      {
        tag: 'V-302',
        name: 'Control Valve V-302',
        asset_type: 'Control Valve',
        plant_area: 'Unit-3',
        criticality: 'B',
        knowledge_completeness: 0.31,
        relationships: [],
      },
    ];

    for (const assetData of demoAssets) {
      await Asset.findOneAndUpdate(
        { tag: assetData.tag },
        { $set: assetData },
        { upsert: true, new: true }
      );
      console.log(`  ✓ Upserted Asset: ${assetData.tag} (${assetData.asset_type}, Criticality: ${assetData.criticality})`);
    }

    // -------------------------------------------------------------------------
    // 2. Seed Failure Signatures
    // -------------------------------------------------------------------------
    console.log('\n▶ Seeding 2 FailureSignature documents...');

    const demoSignatures = [
      {
        equipment_type: 'Centrifugal_Pump',
        failure_mode: 'bearing_failure',
        precursor_signals: ['elevated_vibration', 'temperature_rise', 'seal_leak'],
        avg_days_to_failure: 11,
        occurrence_count: 3,
        detection_method: 'Vibration analysis trend > 7.5 mm/s RMS & thermocouple alerts',
        resolution: 'Replace inboard/outboard radial bearings and check pump-motor alignment to 0.05 mm tolerance.',
      },
      {
        equipment_type: 'Heat_Exchanger',
        failure_mode: 'tube_fouling',
        precursor_signals: ['pressure_drop_increase', 'flow_reduction'],
        avg_days_to_failure: 22,
        occurrence_count: 2,
        detection_method: 'Differential pressure transmitter alert across shell side',
        resolution: 'Perform chemical cleaning or high-pressure hydro-blasting of tube bundle during scheduled shutdown.',
      },
    ];

    for (const sig of demoSignatures) {
      // Embed the failure_mode and precursor signals for semantic matching
      const textToEmbed = `${sig.failure_mode} ${sig.precursor_signals.join(' ')}`;
      const embedded = await embedTexts([textToEmbed]);
      const sigEmbedding = embedded[0] || [];

      await FailureSignature.findOneAndUpdate(
        { equipment_type: sig.equipment_type, failure_mode: sig.failure_mode },
        { $set: { ...sig, embedding: sigEmbedding } },
        { upsert: true, new: true }
      );
      console.log(`  ✓ Upserted FailureSignature: ${sig.failure_mode} on ${sig.equipment_type}`);
    }

    // -------------------------------------------------------------------------
    // 3. Seed Compliance Mappings
    // -------------------------------------------------------------------------
    console.log('\n▶ Seeding 2 ComplianceMapping documents...');

    const demoMappings = [
      {
        regulation_id: 'OISD-GDN-206',
        clause_id: '4.3.2',
        clause_text: 'Mandatory gas testing using calibrated detector before commencing hot work within hazardous plant boundaries.',
        gap_severity: 'Critical',
        gap_description: 'SOP-MAINT-017 lacks mandatory gas testing requirement before hot work commencement',
        ai_suggested_amendment: 'Add Step 3a: Conduct gas test using calibrated detector within 30 minutes of hot work commencement. Record results in permit log.',
        status: 'open',
      },
      {
        regulation_id: 'FactoryAct-Sec31',
        clause_id: '7.1',
        clause_text: 'Confined space entry procedure requiring dedicated rescue team positioning and pre-briefing before vessel ingress.',
        gap_severity: 'Major',
        gap_description: 'Confined space entry procedure missing rescue team pre-positioning requirement',
        ai_suggested_amendment: 'Add requirement: Rescue team must be positioned and briefed before any confined space entry is authorized.',
        status: 'open',
      },
    ];

    for (const mapping of demoMappings) {
      // Embed clause_text for semantic comparisons
      const embedded = await embedTexts([mapping.clause_text]);
      const clauseEmbedding = embedded[0] || [];

      await ComplianceMapping.findOneAndUpdate(
        { regulation_id: mapping.regulation_id, clause_id: mapping.clause_id },
        { $set: { ...mapping, clause_embedding: clauseEmbedding } },
        { upsert: true, new: true }
      );
      console.log(`  ✓ Upserted ComplianceMapping: ${mapping.regulation_id} Clause ${mapping.clause_id} (${mapping.gap_severity} Gap)`);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅  Demo data seeding completed successfully.`);
    console.log(`${'='.repeat(70)}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌  Fatal error during seeding:`, error.message);
    console.error(error.stack);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

seed();
