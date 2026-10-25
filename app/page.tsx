import { SopWorkspace } from "@/components/SopWorkspace";
import { getAppName } from "@/lib/config";

export default function HomePage() {
  return <SopWorkspace appName={getAppName()} />;
}
