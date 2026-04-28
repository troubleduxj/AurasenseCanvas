import {
  Type,
  Image as ImageIcon,
  Clapperboard,
  UserCircle,
  Plus,
  FolderOpen,
  Bot,
  Images
} from "lucide-react";
import { DragEvent } from "react";
import { NodeType, useStore } from "../store";

const nodeTypes = [
  {
    type: "textNode" as NodeType,
    label: "Text Prompt",
    icon: Type,
    color: "text-zinc-500",
    bg: "bg-zinc-100",
  },
  {
    type: "llmNode" as NodeType,
    label: "Prompt Enhance",
    icon: Bot,
    color: "text-blue-500",
    bg: "bg-blue-100",
  },
  {
    type: "imageNode" as NodeType,
    label: "Image Gen",
    icon: ImageIcon,
    color: "text-indigo-500",
    bg: "bg-indigo-100",
  },
  {
    type: "imageProcessNode" as NodeType,
    label: "Image Process",
    icon: Images,
    color: "text-purple-500",
    bg: "bg-purple-100",
  },
  {
    type: "storyboardNode" as NodeType,
    label: "Storyboard",
    icon: Clapperboard,
    color: "text-amber-500",
    bg: "bg-amber-100",
  },
  {
    type: "characterNode" as NodeType,
    label: "Character",
    icon: UserCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-100",
  },
];

export function Sidebar() {
  const { workflows, currentWorkflowId, createWorkflow, switchWorkflow } =
    useStore();

  const onDragStart = (event: DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-64 border-r border-zinc-200/80 bg-white/60 backdrop-blur-sm h-full flex flex-col pt-4 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
      <div className="px-5 pb-5 border-b border-zinc-100">
        <h2 className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-3 flex items-center gap-2">
          <FolderOpen className="w-3.5 h-3.5" /> Workflows
        </h2>
        <div className="space-y-1">
          {workflows.map((w) => (
            <button
              key={w.id}
              onClick={() => switchWorkflow(w.id)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg truncate transition-all ${
                w.id === currentWorkflowId
                  ? "bg-blue-50 text-blue-700 font-medium border border-blue-100/50 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100/80 font-medium"
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => createWorkflow(`Workflow ${workflows.length + 1}`)}
          className="mt-4 flex items-center justify-center gap-1.5 w-full border border-dashed border-zinc-300 py-2 text-xs font-semibold text-zinc-500 rounded-lg hover:bg-zinc-50 hover:border-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <Plus className="w-3.5 h-3.5" /> New Workflow
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        <h2 className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-3">
          Nodes
        </h2>
        <div className="space-y-2.5">
          {nodeTypes.map((node) => (
            <div
              key={node.type}
              className="flex items-center gap-3 p-2.5 border border-zinc-200/80 rounded-xl cursor-grab active:cursor-grabbing hover:border-zinc-300 hover:shadow-sm transition-all bg-white"
              draggable
              onDragStart={(event) => onDragStart(event, node.type)}
            >
              <div
                className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${node.bg}`}
              >
                <node.icon className={`w-4.5 h-4.5 ${node.color}`} />
              </div>
              <span className="text-sm font-semibold text-zinc-700">
                {node.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
