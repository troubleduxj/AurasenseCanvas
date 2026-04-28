import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { UserCircle, Trash2 } from "lucide-react";
import { useStore } from "../../store";

export function CharacterNode({
  id,
  data,
}: {
  id: string;
  data: { name: string; traits: string; avatarUrl?: string };
}) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const removeNode = useStore((state) => state.removeNode);

  return (
    <Card className=" group relative">
      <CardHeader className="p-3 bg-emerald-50/50 border-b border-emerald-100/60 flex flex-row items-center space-y-0 gap-2">
        <button onClick={() => removeNode(id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-6 h-6 rounded-md bg-white border border-emerald-200/80 flex items-center justify-center shadow-sm text-emerald-500">
          <UserCircle className="w-3.5 h-3.5" />
        </div>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Character Concept
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-50 border-2 border-emerald-200/60 shrink-0 flex items-center justify-center shadow-sm">
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="w-5 h-5 text-emerald-400/60" />
            )}
          </div>
          <input
            className="flex-1 w-full p-1 text-sm font-semibold text-zinc-800 border-b-2 border-zinc-100 bg-transparent focus:outline-none focus:border-emerald-400 placeholder-zinc-300 transition-colors"
            placeholder="Name..."
            value={data.name || ""}
            onChange={(e) => updateNodeData(id, { name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-emerald-600/70 font-semibold mb-1 block tracking-wider">
            Traits & Styles
          </label>
          <textarea
            className="w-full h-16 p-2.5 text-xs text-zinc-800 bg-white border border-zinc-200/80 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200/60 transition-all placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
            placeholder="e.g. cyber-punk, neon hair, grumpy..."
            value={data.traits || ""}
            onChange={(e) => updateNodeData(id, { traits: e.target.value })}
          />
        </div>
      </CardContent>
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="w-4 h-4 border-[3px] border-white bg-emerald-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="w-4 h-4 border-[3px] border-white bg-emerald-400"
      />
    </Card>
  );
}
