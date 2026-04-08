"use client";

import { useEffect, useState } from "react";
import { ProjectConfigurator, type ProjectConfiguratorData } from "./ProjectConfigurator";
import { getGatewaySessionId, track } from "@/lib/ga4";

function getInitialProjectData(): ProjectConfiguratorData {
  return {
    purpose: "",
    artworkStatus: undefined,
    products: [],
    dueDate: "",
    rushFlag: false,
    summary: null,
  };
}

export function QuickQuote() {
  const sessionId = getGatewaySessionId();
  const [projectData, setProjectData] = useState<ProjectConfiguratorData>(getInitialProjectData);

  useEffect(() => {
    track("quick_quote_viewed", { session_id: sessionId });
  }, [sessionId]);

  return (
    <div className="w-full max-w-none lg:max-w-5xl xl:max-w-6xl mx-auto">
      <ProjectConfigurator value={projectData} onChange={setProjectData} />
    </div>
  );
}
