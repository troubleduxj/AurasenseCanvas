import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, Trash2, Type } from "lucide-react";
import { useStore } from "../../store";

export function TextNode({ id, data }: { id: string; data: { text: string } }) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const removeNode = useStore((state) => state.removeNode);

  return (
    <Card className=" group relative">
      <CardHeader className="p-3 bg-zinc-50/80 border-b border-zinc-100/80 flex flex-row items-center space-y-0 gap-2">
        <button onClick={() => removeNode(id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-6 h-6 rounded-md bg-white border border-zinc-200 flex items-center justify-center shadow-sm text-zinc-500">
          <Type className="w-3.5 h-3.5" />
        </div>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Text Prompt
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <textarea
          className="w-full h-24 p-3 text-sm text-zinc-800 bg-white border border-zinc-200/80 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all placeholder:text-zinc-400 leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          placeholder="Enter prompt description..."
          value={data.text || ""}
          onChange={(e) => updateNodeData(id, { text: e.target.value })}
        />
      </CardContent>
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 border-[3px] border-white bg-zinc-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 border-[3px] border-white bg-zinc-400"
      />
    </Card>
  );
}
