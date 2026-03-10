import { getLandingConfig } from "@/lib/landing-config";
import { LandingTracker } from "@/components/landing-tracker";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const config = await getLandingConfig();

  return <LandingTracker header={config.header} text={config.text} />;
}
