import { QRTracker } from "@/components/qr-tracker";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Welcome — ${SITE_NAME}`,
  description:
    "Discover local markets, craft fairs, and vendor events in the Spokane area.",
};

/** Business card QR code landing page. Tracks business_card_qr in Umami. */
export default function QRPage() {
  return <QRTracker />;
}
