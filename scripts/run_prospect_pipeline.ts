#!/usr/bin/env node
// ==============================================================================
// scripts/run_prospect_pipeline.ts — CLI Prospecting Pipeline Runner
// ==============================================================================

import fs from 'fs';
import path from 'path';

// Load .env.local and .env without external dotenv dependency
['.env.local', '.env'].forEach((envFile) => {
  const fullPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) {
    const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
});

import { ProspectPipelineOrchestrator } from '../src/services/prospect/ProspectPipelineOrchestrator';

async function main() {
  console.log('🚀 Starting TradeFlow Daily Prospect Automation Pipeline...');

  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const marketArg = args.find((a) => a.startsWith('--market='));
  const marketId = marketArg ? marketArg.split('=')[1] : undefined;
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const targetDailyLeads = limitArg ? parseInt(limitArg.split('=')[1], 10) : 30;

  const orchestrator = new ProspectPipelineOrchestrator();

  try {
    const metrics = await orchestrator.executeDailyPipeline({
      dryRun: isDryRun,
      marketId,
      targetDailyLeads,
    });

    console.log('✅ Pipeline Execution Completed:');
    console.log(`   - Run ID: ${metrics.runId}`);
    console.log(`   - Market: ${metrics.marketId}`);
    console.log(`   - Candidates Discovered: ${metrics.candidatesFound}`);
    console.log(`   - Duplicates Filtered: ${metrics.duplicatesFiltered}`);
    console.log(`   - Qualified Prospects: ${metrics.qualifiedCount}`);
    console.log(`   - Notion Pages Created: ${metrics.notionCreatedCount}`);
    if (metrics.errors.length > 0) {
      console.log(`   - Notes / Warnings: ${metrics.errors.map((e) => `[${e.step}] ${e.message}`).join(', ')}`);
    }
  } catch (err: any) {
    console.error('❌ Pipeline execution failed:', err.message);
    process.exit(1);
  }
}

main();
