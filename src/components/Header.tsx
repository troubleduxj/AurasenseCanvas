import { Download, Play, Save } from "lucide-react";
import { useStore } from "../store";
import * as htmlToImage from "html-to-image";
import { useCallback } from "react";

export function Header() {
  const { workflows, currentWorkflowId, renameWorkflow } = useStore();

  const currentWorkflow = workflows.find((w) => w.id === currentWorkflowId);

  const handleExportImage = useCallback(() => {
    // Basic implementation to find the react flow canvas and save as image.
    // Notice this uses html2canvas/html-to-image logic.
    const flowEl = document.querySelector(".react-flow") as HTMLElement;
    if (!flowEl) return;

    htmlToImage
      .toPng(flowEl, { backgroundColor: "#f4f4f5" })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `workflow-${currentWorkflow?.name || "export"}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Failed to export image", err);
      });
  }, [currentWorkflow]);

  const handleExportJSON = useCallback(() => {
    if (!currentWorkflow) return;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(currentWorkflow, null, 2));
    const link = document.createElement("a");
    link.download = `workflow-${currentWorkflow.name}.json`;
    link.href = dataStr;
    link.click();
  }, [currentWorkflow]);

  if (!currentWorkflow) return null;

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 flex items-center justify-between px-6 shrink-0 relative z-10 w-full shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-600/20">
          <Play className="w-4 h-4 text-white ml-0.5" />
        </div>
        <div className="flex flex-col">
          <input
            type="text"
            className="font-semibold text-base text-zinc-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-1.5 -ml-1.5 transition-all hover:bg-zinc-100/50"
            value={currentWorkflow.name}
            onChange={(e) => renameWorkflow(currentWorkflow.id, e.target.value)}
          />
          <p className="text-[11px] font-medium text-zinc-500 ml-0.5">
            StoryFlow Workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
        >
          <Save className="w-3.5 h-3.5" /> Export JSON
        </button>
        <button
          onClick={handleExportImage}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20"
        >
          <Download className="w-3.5 h-3.5" /> Export Image
        </button>
      </div>
    </header>
  );
}
