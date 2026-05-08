import packageJson from "../../../package.json";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default function SettingsPage() {
  const nextVersion =
    typeof packageJson.dependencies?.next === "string"
      ? packageJson.dependencies.next
      : "unknown";

  return (
    <SettingsClient
      appVersion={packageJson.version}
      nodeVersion={process.version}
      nextVersion={nextVersion}
    />
  );
}
