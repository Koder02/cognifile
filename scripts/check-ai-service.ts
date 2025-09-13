import { AIService } from '../src/services/AIService';

async function run() {
  const service = AIService.getInstance();
  const ready = await service.isReady();
  console.log('AIService ready:', ready);
}

run().catch(err => {
  console.error('Error running AIService check:', err);
  process.exit(1);
});
