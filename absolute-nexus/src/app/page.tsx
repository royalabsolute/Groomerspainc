import React from "react";
import DashboardContent from "@/components/DashboardContent";

export const dynamic = "force-dynamic";

export default async function NexusDashboard() {
  // Read all system environment variables
  const allEnvKeys = Object.keys(process.env).sort();
  
  // Filter and mask keys to avoid exposing secrets to the client bundle
  const envVars = allEnvKeys
    .filter((key) => {
      // Exclude noisy local/npm/system paths that are not relevant
      const lowerKey = key.toLowerCase();
      return (
        !key.startsWith("npm_") &&
        !key.startsWith("NODE_") &&
        !lowerKey.includes("path") &&
        !lowerKey.includes("programfiles") &&
        !lowerKey.includes("commonprogram") &&
        !lowerKey.includes("system") &&
        !lowerKey.includes("windir") &&
        !lowerKey.includes("userprofile") &&
        !lowerKey.includes("allusersprofile") &&
        !lowerKey.includes("public") &&
        !lowerKey.includes("onedrive") &&
        !lowerKey.includes("temp") &&
        !lowerKey.includes("tmp") &&
        key !== "OS" &&
        key !== "ComSpec" &&
        key !== "PSModulePath"
      );
    })
    .map((key) => {
      const val = process.env[key] || "";
      let masked = "";
      if (val) {
        // Show masked format: ******************
        masked = "******************";
      } else {
        masked = "(vacío)";
      }
      return { key, value: masked };
    });

  return <DashboardContent envVars={envVars} />;
}
