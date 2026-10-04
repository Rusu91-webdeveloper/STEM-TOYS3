import { permanentRedirect } from "next/navigation";

export default function GDPRPage() {
  permanentRedirect("/privacy#drepturi");
}
