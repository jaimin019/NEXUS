/**
 * seedDemoData.js
 * Creates a complete, realistic industrial plant scenario for the NEXUS demo:
 * Plant: Bharat Refinery Unit-3, Vadodara.
 * 
 * Includes Assets, Documents, Chunks, FailureSignatures, and ComplianceMappings.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const Asset = require(path.join(__dirname, '../models/Asset'));
const Document = require(path.join(__dirname, '../models/Document'));
const Chunk = require(path.join(__dirname, '../models/Chunk'));
const FailureSignature = require(path.join(__dirname, '../models/FailureSignature'));
const ComplianceMapping = require(path.join(__dirname, '../models/ComplianceMapping'));

// Generate a pseudo-random embedding vector for demo search
function generateDemoEmbedding() {
  return Array.from({ length: 384 }, () => (Math.random() - 0.5) * 0.1);
}

async function seed() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀  NEXUS Demo Data Seeder — Bharat Refinery Unit-3`);
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

    // CLEAR DB BEFORE SEEDING to avoid duplicates in this comprehensive demo seed
    await Promise.all([
      Asset.deleteMany({}),
      Document.deleteMany({}),
      Chunk.deleteMany({}),
      FailureSignature.deleteMany({}),
      ComplianceMapping.deleteMany({}),
    ]);
    console.log('Cleared existing demo data.\n');

    // -------------------------------------------------------------------------
    // 1. Seed Assets (8)
    // -------------------------------------------------------------------------
    console.log('▶ Seeding Assets...');
    const demoAssets = [
      {
        tag: 'P-101', name: 'Feed Pump 101', asset_type: 'Centrifugal_Pump',
        plant_area: 'Unit-3-Feed-Section', criticality: 'A',
        relationships: [
          { target_tag: 'HX-204', type: 'FEEDS_INTO', confidence: 0.97, inferred_by: 'piid_parse' },
          { target_tag: 'FCV-301', type: 'CONTROLLED_BY', confidence: 0.91, inferred_by: 'llm' }
        ],
        knowledge_completeness: 0.73,
        open_work_orders: 2, active_permits: 0,
        health_indicators: { vibration_trend: 'rising', last_inspection_result: 'satisfactory', days_since_last_maintenance: 47 }
      },
      {
        tag: 'HX-204', name: 'Feed-Effluent Heat Exchanger 204', asset_type: 'Heat_Exchanger',
        plant_area: 'Unit-3-Feed-Section', criticality: 'A',
        relationships: [
          { target_tag: 'P-101', type: 'FED_BY', confidence: 0.97, inferred_by: 'piid_parse' },
          { target_tag: 'R-301', type: 'FEEDS_INTO', confidence: 0.88, inferred_by: 'llm' }
        ],
        knowledge_completeness: 0.45,
        open_work_orders: 0, active_permits: 1,
        health_indicators: { vibration_trend: 'stable', last_inspection_result: 'minor_fouling_detected', days_since_last_maintenance: 112 }
      },
      {
        tag: 'R-301', name: 'Hydrotreater Reactor 301', asset_type: 'Reactor',
        plant_area: 'Unit-3-Reaction-Section', criticality: 'A',
        relationships: [
          { target_tag: 'HX-204', type: 'FED_BY', confidence: 0.88, inferred_by: 'llm' },
          { target_tag: 'V-302', type: 'FEEDS_INTO', confidence: 0.94, inferred_by: 'piid_parse' }
        ],
        knowledge_completeness: 0.81,
        open_work_orders: 0, active_permits: 0,
        health_indicators: { vibration_trend: 'stable', last_inspection_result: 'satisfactory', days_since_last_maintenance: 23 }
      },
      {
        tag: 'V-302', name: 'High Pressure Separator V-302', asset_type: 'Pressure_Vessel',
        plant_area: 'Unit-3-Separation-Section', criticality: 'A',
        relationships: [
          { target_tag: 'R-301', type: 'FED_BY', confidence: 0.94, inferred_by: 'piid_parse' },
          { target_tag: 'FCV-301', type: 'CONTROLLED_BY', confidence: 0.82, inferred_by: 'llm' }
        ],
        knowledge_completeness: 0.31,
        open_work_orders: 1, active_permits: 0,
        health_indicators: { vibration_trend: 'stable', last_inspection_result: 'satisfactory', days_since_last_maintenance: 67 }
      },
      {
        tag: 'FCV-301', name: 'Feed Flow Control Valve 301', asset_type: 'Control_Valve',
        plant_area: 'Unit-3-Feed-Section', criticality: 'B',
        relationships: [
          { target_tag: 'P-101', type: 'CONTROLLED_BY', confidence: 0.91, inferred_by: 'llm' },
          { target_tag: 'V-302', type: 'INTERLOCKED_WITH', confidence: 0.85, inferred_by: 'llm' }
        ],
        knowledge_completeness: 0.58,
        open_work_orders: 0, active_permits: 0,
        health_indicators: { vibration_trend: 'stable', last_inspection_result: 'satisfactory', days_since_last_maintenance: 31 }
      },
      {
        tag: 'C-401', name: 'Product Fractionator C-401', asset_type: 'Distillation_Column',
        plant_area: 'Unit-3-Fractionation-Section', criticality: 'A',
        relationships: [
          { target_tag: 'V-302', type: 'FED_BY', confidence: 0.79, inferred_by: 'llm' }
        ],
        knowledge_completeness: 0.62,
        open_work_orders: 0, active_permits: 0,
        health_indicators: { vibration_trend: 'stable', last_inspection_result: 'satisfactory', days_since_last_maintenance: 18 }
      },
      {
        tag: 'P-102', name: 'Reflux Pump 102', asset_type: 'Centrifugal_Pump',
        plant_area: 'Unit-3-Fractionation-Section', criticality: 'B',
        relationships: [
          { target_tag: 'C-401', type: 'FEEDS_INTO', confidence: 0.93, inferred_by: 'piid_parse' }
        ],
        knowledge_completeness: 0.29,
        open_work_orders: 3, active_permits: 0,
        health_indicators: { vibration_trend: 'rising', last_inspection_result: 'bearing_wear_noted', days_since_last_maintenance: 94 }
      },
      {
        tag: 'E-501', name: 'Overhead Air Cooler E-501', asset_type: 'Air_Cooler',
        plant_area: 'Unit-3-Fractionation-Section', criticality: 'B',
        relationships: [
          { target_tag: 'C-401', type: 'FED_BY', confidence: 0.86, inferred_by: 'llm' }
        ],
        knowledge_completeness: 0.44,
        open_work_orders: 0, active_permits: 0,
        health_indicators: { vibration_trend: 'decreasing', last_inspection_result: 'tube_cleaning_done', days_since_last_maintenance: 7 }
      }
    ];

    for (const a of demoAssets) {
      await Asset.create(a);
    }
    console.log(`  ✓ Seeded ${demoAssets.length} Assets.`);

    // -------------------------------------------------------------------------
    // 2. Seed Documents & Chunks
    // -------------------------------------------------------------------------
    console.log('\n▶ Seeding Documents & Chunks...');
    
    // Note: In a real system, the actual ingestion pipeline would generate real semantic embeddings.
    // We are generating pseudo-random embeddings here just to fulfill the data model for the UI demo.
    console.log('  ⚠️ Using pseudo-random embeddings for demo speed. Run real ingestion for true semantic search.');

    const demoDocs = [
      {
        doc: { title: 'SOP-MAINT-017: Isolation and Maintenance Procedure for Centrifugal Pumps', doc_type: 'SOP', equipment_tags: ['P-101','P-102'], regulatory_refs: ['OISD-GDN-206','FactoryAct-Sec31'] },
        chunks: [
          { raw_text: "1. Scope: This procedure applies to all centrifugal pumps in Unit-3 including P-101 and P-102. 2. Pre-isolation requirements: Inform shift supervisor and log in PTW system. Ensure standby pump is running and stable before isolating primary. 3. Isolation steps: 3.1 Close suction valve (SV-101A) slowly to avoid water hammer. 3.2 Close discharge valve (DV-101A). 3.3 De-energize motor at MCC panel. 3.4 Apply LOTO (Lockout-Tagout) on MCC breaker. 3.5 Open drain valve to depressurize casing. 3.6 Verify zero energy state with pressure gauge." },
          { raw_text: "4. Maintenance activities permitted after isolation: Mechanical seal replacement, bearing inspection and replacement, impeller inspection, coupling alignment check. 5. Return to service: 5.1 Close all drain valves. 5.2 Open suction valve slowly. 5.3 Vent air from casing using vent plug. 5.4 Remove LOTO. 5.5 Start pump and monitor for 15 minutes. 5.6 Check vibration levels — should be below 4.5 mm/s RMS. 5.7 Check seal leakage — maximum 1 drop per minute acceptable. WARNING: Do not start pump against closed discharge valve — this will cause deadhead condition and rapid bearing failure." },
          { raw_text: "6. Emergency shutdown: If pump vibration exceeds 7.1 mm/s RMS or bearing temperature exceeds 85°C, initiate emergency shutdown immediately. Notify shift supervisor. Do not restart without engineering approval. 7. Regulatory compliance: This procedure complies with OISD-GDN-206 Section 4.2 and Factory Act Section 31. Gas testing is required before any hot work in the pump area. NOTE: OISD-GDN-206 Clause 4.3.2 requires gas testing within 30 minutes of hot work commencement — this step is currently missing from Section 7 of this SOP." }
        ]
      },
      {
        doc: { title: 'WO-2024-1847: P-101 Bearing Inspection — Vibration Alert', doc_type: 'WorkOrder', equipment_tags: ['P-101'] },
        chunks: [
          { raw_text: "Work Order: WO-2024-1847. Equipment: P-101 Feed Pump. Priority: HIGH. Raised by: S. Mehta (Condition Monitoring). Date: 14-Jan-2024. Description: Vibration monitoring system flagged P-101 with overall vibration level of 5.8 mm/s RMS on DE bearing housing. This represents a 28% increase from baseline of 4.5 mm/s over the past 3 weeks. Trend is continuously increasing. Spectrum analysis shows dominant frequency at 1x RPM indicating rotor unbalance or shaft misalignment. Recommendation: Inspect coupling alignment and bearing condition within 72 hours." },
          { raw_text: "Actions taken: 14-Jan-2024 — Coupling alignment checked. Found 0.15mm angular misalignment on motor-pump coupling. Corrected to 0.02mm. Vibration rechecked: 5.1 mm/s RMS — marginal improvement. 17-Jan-2024 — Bearing inspection scheduled. Found DE bearing showing early stage pitting on inner race. Bearing replaced (SKF 6312-2RS). Post-replacement vibration: 3.8 mm/s RMS. Status: Closed. Note: This is the third bearing replacement on P-101 in 5 years (previous: Mar 2019, Sep 2021). Pattern suggests possible structural resonance issue. Recommend full root cause analysis." }
        ]
      },
      {
        doc: { title: 'IR-2019-034: Incident Report — P-101 Bearing Failure and Consequential HX-204 Damage', doc_type: 'IncidentReport', equipment_tags: ['P-101','HX-204'] },
        chunks: [
          { raw_text: "Incident Report IR-2019-034. Date: 22-Mar-2019. Equipment: P-101, HX-204. Severity: Major. Description: P-101 bearing failed catastrophically during night shift. Bearing seizure caused rotor lockup and mechanical seal failure. Process fluid leaked from mechanical seal — approximately 40 litres of diesel range hydrocarbons released before isolation. Consequential impact: HX-204 inlet flow dropped to zero, causing thermal shock to tube bundle. Three tubes failed due to differential thermal expansion. Plant shutdown: 34 hours for repair. Root cause: Bearing lubrication failure due to blocked oil mist fitting. Contributing factor: Vibration increase trend observed over 14 days prior but no maintenance action taken." },
          { raw_text: "Precursor signals identified in post-incident review: 1) Vibration level increased from 3.2 to 6.8 mm/s over 14 days prior to failure. 2) Bearing temperature rose from 52°C to 71°C in final 48 hours. 3) Oil mist sight glass showed reduced flow — noted in operator round log but not escalated. Lessons learned: 1) Vibration trending above 5.5 mm/s on P-101 class pumps must trigger mandatory inspection within 48 hours. 2) Oil mist flow must be included in hourly operator rounds. 3) HX-204 thermal inspection must be conducted after any unplanned P-101 shutdown exceeding 2 hours. Time from first precursor to failure: 14 days." }
        ]
      },
      {
        doc: { title: 'OISD-GDN-206: Oil Industry Safety Directorate Guidelines for Petroleum Refineries', doc_type: 'Regulation', equipment_tags: [], regulatory_refs: ['OISD-GDN-206'] },
        chunks: [
          { raw_text: "OISD-GDN-206 Section 4: Work Permit System. 4.1 General: A formal work permit system shall be implemented for all non-routine maintenance activities. 4.2 Permit types: Cold Work Permit, Hot Work Permit, Confined Space Entry Permit, Electrical Work Permit, Height Work Permit. All permits must be signed by area authority and safety officer before work commencement. 4.3 Hot Work Permit requirements: Hot work includes welding, cutting, grinding, and use of open flame within the refinery boundary." },
          { raw_text: "4.3.2 Gas testing requirements for hot work: A calibrated combustible gas detector shall be used to test the atmosphere within 7.5 metres of the hot work location. Testing must be conducted within 30 minutes of work commencement. If gas concentration exceeds 10% of Lower Explosive Limit (LEL), work must stop immediately and area must be evacuated. Gas testing must be repeated every 2 hours during continuous hot work operations. Test results must be recorded on the permit form with tester signature and timestamp. Failure to comply with gas testing requirements constitutes a critical safety violation." },
          { raw_text: "4.4 Confined Space Entry: A confined space entry permit is required for entry into vessels, tanks, columns, and other enclosed spaces. Requirements: 4.4.1 Atmosphere testing for oxygen (19.5-23.5% acceptable), combustibles (<10% LEL), and toxic gases (H2S <10 ppm, CO <25 ppm). 4.4.2 Rescue team must be positioned and briefed at entry point before any entry. 4.4.3 Continuous atmospheric monitoring during entry. 4.4.4 Attendant must maintain visual or verbal contact with entrant at all times. 4.4.5 Emergency rescue equipment including SCBA must be available at entry point." }
        ]
      },
      {
        doc: { title: 'INSP-2023-HX204: HX-204 Annual Inspection Report', doc_type: 'InspectionRecord', equipment_tags: ['HX-204'] },
        chunks: [
          { raw_text: "Inspection Report INSP-2023-HX204. Date: 15-Nov-2023. Inspector: R. Patel (ASNT Level II). Equipment: HX-204 Feed-Effluent Heat Exchanger. Type: Shell and Tube, 2-pass. Design pressure: 85 bar shell / 42 bar tube. Findings: Shell side — Minor corrosion on baffle plates, within acceptable limits. Tube side — 3 tubes showing wall thickness below 80% of nominal (minimum acceptable). Recommendation: Plug these 3 tubes. Overall condition: Satisfactory for continued operation until next scheduled inspection. Tube bundle fouling: Moderate. Pressure drop across exchanger has increased 18% since last cleaning." },
          { raw_text: "Detailed measurements: Tube sheet condition — No cracks detected, PT test clear. Nozzle condition — All nozzles satisfactory. Gasket replacement — Shell cover gaskets replaced (Spiral wound, SS316/graphite). Next inspection due: Nov-2024 — OVERDUE as of current date. Action required: Schedule tube bundle cleaning to address fouling and restore heat transfer efficiency. Note: The 18% pressure drop increase is consistent with progressive fouling. If left unaddressed, flow reduction will impact R-301 reactor inlet temperature by estimated 12-15°C, affecting product quality." }
        ]
      },
      {
        doc: { title: 'Expert Interview — R. Kumar — P-101 and V-302 Operational Knowledge', doc_type: 'ExpertInterview', equipment_tags: ['P-101','V-302'] },
        chunks: [
          { raw_text: "Expert: Rajesh Kumar, Senior Process Engineer, 28 years at Bharat Refinery. Retired: March 2024. Question: P-101 has had three bearing failures in 5 years. What do you know about this pump that isn't in the official records? Answer: P-101 sits on a concrete plinth that was repoured in 2016 after the original developed cracks. The repour was never fully cured before the pump was reinstalled — I raised this in writing at the time. The plinth has a natural resonance frequency very close to P-101's operating speed. This is why you keep getting bearing failures — it's not a maintenance problem, it's a structural problem. The real fix is to either repour the plinth correctly or install vibration isolation mounts. The official RCA reports never captured this because nobody checked the plinth.", is_tacit_knowledge: true },
          { raw_text: "Question: V-302 has the lowest knowledge completeness score in Unit-3. What undocumented procedures should operators know? Answer: V-302's drain valve (DV-302B) has a history of sticking during cold startups. This is because condensation collects in the valve body during shutdown and causes partial seizure on the threads. The standard procedure says open DV-302B before pressurisation — but if you follow that sequence on a cold startup, you'll find it won't budge. What actually works: apply heat gun to valve body for 3-4 minutes before attempting to open. Never use a cheater bar on this valve — I've seen two operators injure their wrists trying to force it. This workaround is known to every operator with more than 5 years on Unit-3 but it's not written anywhere.", is_tacit_knowledge: true },
          { raw_text: "Question: Is there anything else about Unit-3 that a new engineer needs to know that isn't documented? Answer: HX-204's isolation during P-101 maintenance is tricky. The official procedure says isolate P-101 first, then HX-204. But if P-101 is hot (above 180°C process temperature), isolating it first causes a pressure spike in the suction line that can trip FCV-301 on high-pressure interlock. What I always did: partially close FCV-301 first (about 30% closed) to reduce flow, then isolate P-101, then fully close FCV-301. This prevents the interlock trip and avoids a unit upset. I'm not sure this is written anywhere — it's just what experienced operators learned to do over the years.", is_tacit_knowledge: true }
        ]
      }
    ];

    let totalChunks = 0;
    const docRecords = [];

    for (const d of demoDocs) {
      const docData = {
        ...d.doc,
        ingestion_status: 'complete',
        entity_count: d.doc.equipment_tags?.length || 0,
        chunk_count: d.chunks.length,
        graph_edges_created: (d.doc.equipment_tags?.length || 0) * 2,
        version: 1,
      };
      const createdDoc = await Document.create(docData);
      docRecords.push(createdDoc);

      for (let i = 0; i < d.chunks.length; i++) {
        const c = d.chunks[i];
        await Chunk.create({
          doc_id: createdDoc._id,
          chunk_index: i,
          text: c.raw_text,
          raw_text: c.raw_text,
          embedding: generateDemoEmbedding(),
          doc_type: createdDoc.doc_type,
          equipment_tags: createdDoc.equipment_tags,
          regulatory_refs: createdDoc.regulatory_refs,
          is_tacit_knowledge: c.is_tacit_knowledge || false,
        });
        totalChunks++;
      }
    }
    console.log(`  ✓ Seeded ${demoDocs.length} Documents and ${totalChunks} Chunks.`);

    // -------------------------------------------------------------------------
    // 3. Seed Failure Signatures (3)
    // -------------------------------------------------------------------------
    console.log('\n▶ Seeding Failure Signatures...');
    
    // Find incident doc if available for source
    const incidentDoc = docRecords.find(d => d.doc_type === 'IncidentReport');

    const demoSignatures = [
      {
        equipment_type: 'Centrifugal_Pump', failure_mode: 'bearing_failure',
        precursor_signals: ['elevated_vibration_above_5.5mms','bearing_temperature_rise','oil_mist_flow_reduction','seal_leakage_increase'],
        contributing_conditions: ['structural_resonance','delayed_maintenance_response','lubrication_system_blockage'],
        avg_days_to_failure: 11, detection_method: 'vibration_monitoring',
        resolution: 'bearing_replacement_and_root_cause_analysis_of_resonance',
        occurrence_count: 3,
        source_incidents: incidentDoc ? [incidentDoc._id] : [],
        embedding: generateDemoEmbedding()
      },
      {
        equipment_type: 'Heat_Exchanger', failure_mode: 'tube_fouling_and_failure',
        precursor_signals: ['pressure_drop_increase_above_15pct','flow_reduction','outlet_temperature_drop'],
        contributing_conditions: ['overdue_inspection','upstream_pump_unplanned_shutdown','thermal_shock'],
        avg_days_to_failure: 22, detection_method: 'pressure_differential_monitoring',
        resolution: 'tube_bundle_cleaning_and_plugging_failed_tubes',
        occurrence_count: 2,
        embedding: generateDemoEmbedding()
      },
      {
        equipment_type: 'Control_Valve', failure_mode: 'valve_seizure',
        precursor_signals: ['increased_actuator_pressure','hunting_behavior','position_feedback_deviation'],
        contributing_conditions: ['cold_startup','condensation_accumulation','infrequent_operation'],
        avg_days_to_failure: 3, detection_method: 'operator_observation',
        resolution: 'heat_application_and_manual_exercise_do_not_force_with_extension',
        occurrence_count: 1,
        embedding: generateDemoEmbedding()
      }
    ];

    for (const sig of demoSignatures) {
      await FailureSignature.create(sig);
    }
    console.log(`  ✓ Seeded ${demoSignatures.length} Failure Signatures.`);

    // -------------------------------------------------------------------------
    // 4. Seed Compliance Mappings (4)
    // -------------------------------------------------------------------------
    console.log('\n▶ Seeding Compliance Mappings...');

    const demoMappings = [
      {
        regulation_id: 'OISD-GDN-206', clause_id: '4.3.2',
        clause_text: 'Gas testing must be conducted within 30 minutes of hot work commencement. Results must be recorded on permit form.',
        gap_severity: 'Critical', status: 'open',
        gap_description: 'SOP-MAINT-017 Section 7 references hot work in pump area but does not include mandatory gas testing step required by OISD-GDN-206 Clause 4.3.2. This creates a critical safety and regulatory compliance gap.',
        ai_suggested_amendment: 'Add Step 7.3 to SOP-MAINT-017: "Before commencing any hot work in the P-101/P-102 pump area: (a) Conduct atmosphere test using calibrated combustible gas detector within 30 minutes of work start. (b) Verify gas concentration below 10% LEL. (c) Record test result, tester name, and timestamp on Hot Work Permit form. (d) Repeat testing every 2 hours during continuous hot work. Stop work immediately if LEL exceeds 10%."',
        clause_embedding: generateDemoEmbedding()
      },
      {
        regulation_id: 'OISD-GDN-206', clause_id: '4.4.2',
        clause_text: 'Rescue team must be positioned and briefed at entry point before any confined space entry.',
        gap_severity: 'Critical', status: 'open',
        gap_description: 'No confined space entry procedure found for V-302 High Pressure Separator. OISD-GDN-206 Clause 4.4.2 requires rescue team pre-positioning. This procedure is completely absent from the indexed document corpus.',
        ai_suggested_amendment: 'Create new SOP: CSE-V302-001 Confined Space Entry Procedure for V-302. Must include: rescue team assignment and briefing checklist, atmospheric testing sequence, attendant responsibilities, emergency evacuation signal protocol, and rescue equipment positioning requirements per OISD-GDN-206 Section 4.4.',
        clause_embedding: generateDemoEmbedding()
      },
      {
        regulation_id: 'FactoryAct-Sec31', clause_id: '7.1',
        clause_text: 'Every vessel, pipe, or plant in which pressure above atmospheric may obtain shall be properly maintained and examined at prescribed intervals.',
        gap_severity: 'Major', status: 'in_review',
        gap_description: 'HX-204 annual inspection is overdue by approximately 2 months (due Nov-2024). INSP-2023-HX204 noted 3 tubes below minimum wall thickness requiring plugging. No evidence that plugging was completed or reinspection conducted.',
        ai_suggested_amendment: 'Immediately schedule HX-204 reinspection to confirm tube plugging status. Update inspection management system with overdue flag. Initiate Factory Act compliance notification to Plant Safety Officer. Target completion: within 30 days.',
        clause_embedding: generateDemoEmbedding()
      },
      {
        regulation_id: 'OISD-GDN-206', clause_id: '4.2',
        clause_text: 'All permits must be signed by area authority and safety officer before work commencement.',
        gap_severity: 'Minor', status: 'resolved',
        gap_description: 'WO-2024-1847 work order for P-101 bearing inspection did not reference PTW permit number in work order body.',
        ai_suggested_amendment: 'Update work order template to include mandatory PTW permit number field. Add validation in SAP PM to prevent WO closure without PTW reference.',
        resolution_note: 'Work order template updated in SAP PM. Training conducted with maintenance planning team. Verified in last 3 work orders.',
        clause_embedding: generateDemoEmbedding()
      }
    ];

    for (const mapping of demoMappings) {
      await ComplianceMapping.create(mapping);
    }
    console.log(`  ✓ Seeded ${demoMappings.length} Compliance Mappings.`);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ NEXUS Demo Data Seeded Successfully`);
    console.log(`📊 Assets: ${demoAssets.length} | Documents: ${demoDocs.length} | Chunks: ${totalChunks} | Failure Patterns: ${demoSignatures.length} | Compliance Gaps: ${demoMappings.length}`);
    console.log(`🏭 Plant: Bharat Refinery Unit-3, Vadodara`);
    console.log(`🚀 Ready for demo — run the app and explore!`);
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
