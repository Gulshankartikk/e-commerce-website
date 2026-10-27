import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
dotenv.config({ path: path.resolve('backend/.env') });

import { connectDB } from '../src/config/db.js';
import { ingestAllKnowledgeDocuments } from '../src/services/knowledgeIngestionService.js';
import mongoose from 'mongoose';

async function run() {
  console.log('🚀 Starting FlashShop Knowledge Base Ingestion...');
  await connectDB();

  try {
    const result = await ingestAllKnowledgeDocuments();
    console.log(`\n🎉 Successfully indexed ${result.documentCount} canonical documents (${result.totalChunks} chunks) with 768-d embeddings.`);
  } catch (err) {
    console.error('❌ Knowledge ingestion error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected.');
  }
}

run();
