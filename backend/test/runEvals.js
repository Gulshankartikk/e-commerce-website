import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
dotenv.config({ path: path.resolve('backend/.env') });

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { runEvaluationSuite } from '../src/services/evalRunnerService.js';

async function main() {
  await connectDB();

  try {
    const summary = await runEvaluationSuite({
      triggerType: 'ci_automated',
    });

    if (!summary.qualityGatePassed) {
      console.error('❌ Quality gate thresholds were not met. Check failed test cases above.');
      process.exit(1);
    } else {
      console.log('✅ All evaluation quality gate checks passed successfully!');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Evaluation suite crashed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
