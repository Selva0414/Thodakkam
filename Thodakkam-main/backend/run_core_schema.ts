import { ensureCoreSchema, ensureMasterAdmin } from './config/ensureCoreSchema';

async function init() {
  try {
    await ensureCoreSchema();
    await ensureMasterAdmin();
    console.log('Successfully initialized core schema');
  } catch (err) {
    console.error('Error during init:', err);
  } finally {
    process.exit(0);
  }
}

init();
