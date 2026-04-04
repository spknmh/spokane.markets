import { processNextQueuedMarketingRender } from "@/lib/marketing/render-worker";

async function main() {
  const max = Number(process.env.MARKETING_WORKER_BATCH_SIZE ?? "10");
  let processed = 0;
  for (let i = 0; i < max; i += 1) {
    const id = await processNextQueuedMarketingRender();
    if (!id) break;
    processed += 1;
    console.log(`[marketing-worker] processed render ${id}`);
  }
  console.log(`[marketing-worker] completed batch; processed=${processed}`);
}

main().catch((err) => {
  console.error("[marketing-worker] failed", err);
  process.exit(1);
});
