import React, { useEffect, useRef } from "react";

export default function MediaAiTab({ prefillCampaign }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (prefillCampaign) {
      try {
        localStorage.setItem("redetv_media_ai_prefill", JSON.stringify(prefillCampaign));
      } catch (e) {}
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.location.reload();
      }
    }
  }, [prefillCampaign]);

  return (
    <div className="w-full h-full min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col">
      <iframe
        ref={iframeRef}
        src="/media-planner/media-ai.html"
        title="Med.IA Planner"
        className="w-full flex-1 min-h-[calc(100vh-64px)] border-0"
      />
    </div>
  );
}
