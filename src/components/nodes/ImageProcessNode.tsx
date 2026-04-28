import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ImagePlus, Images, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { useStore } from "../../store";
import { useEffect } from "react";

export function ImageProcessNode({
  id,
  data,
}: {
  id: string;
  data: {
    processType?: string;
    imageUrl?: string;
    isGenerating?: boolean;
    error?: string;
  };
}) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const removeNode = useStore((state) => state.removeNode);
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);
  const registerNodeHandler = useStore((state) => state.registerNodeHandler);
  const unregisterNodeHandler = useStore((state) => state.unregisterNodeHandler);

  const handleGenerate = async () => {
    const connectedEdges = edges.filter((edge) => edge.target === id);
    const hasImageInput = connectedEdges.some((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      return sourceNode?.type === "imageNode";
    });

    let inputImageUrl = "";
    for (const edge of connectedEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode?.type === "imageNode" && typeof sourceNode.data.imageUrl === "string") {
        inputImageUrl = sourceNode.data.imageUrl;
      }
    }

    if (!hasImageInput || !inputImageUrl) {
      updateNodeData(id, { error: "请在左侧连接已生成图像的节点！" });
      throw new Error("Missing input");
    }

    updateNodeData(id, { isGenerating: true, error: undefined });

    try {
      // Mock processing - wait for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const processType = data.processType || "upscale";
      
      // We will just append a query param to modify the image slightly
      const outputImageUrl = inputImageUrl.includes('?') 
        ? `${inputImageUrl}&processed=${processType}` 
        : `${inputImageUrl}?processed=${processType}`;

      updateNodeData(id, {
        imageUrl: outputImageUrl,
        isGenerating: false,
      });
    } catch (err: any) {
      console.error("Generate image process error:", err);
      updateNodeData(id, {
        isGenerating: false,
        error: "加工异常：" + (err.message || String(err)),
      });
      throw err;
    }
  };

  useEffect(() => {
    registerNodeHandler(id, handleGenerate);
    return () => unregisterNodeHandler(id);
  }, [id, edges, nodes, data.processType]); // Re-register when dependencies change

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 border-[3px] border-white bg-purple-500"
      />
      <Card className=" group relative">
        <CardHeader className="p-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl">
        <button onClick={() => removeNode(id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
          <CardTitle className="text-xs font-semibold flex items-center gap-2 text-zinc-700">
            <div className="p-1.5 rounded-md bg-purple-100 text-purple-600">
              <Images className="w-3.5 h-3.5" />
            </div>
            图像加工与处理
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div>
            <label className="text-[10px] uppercase text-purple-600/70 font-semibold mb-1 block tracking-wider">处理方式</label>
            <select 
              className="w-full p-2 text-xs text-zinc-800 bg-white border border-zinc-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200/60 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              value={data.processType || 'upscale'}
              onChange={(e) => updateNodeData(id, { processType: e.target.value })}
            >
              <option value="upscale">图像放大 (Upscale)</option>
              <option value="inpaint">局部重绘 (Inpainting)</option>
              <option value="filter">风格滤镜 (Filter)</option>
            </select>
          </div>

          <button
            onClick={() => handleGenerate().catch(()=>{})}
            disabled={data.isGenerating}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {data.isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImagePlus className="w-3.5 h-3.5" />
            )}
            {data.isGenerating ? "处理中..." : "执行加工"}
          </button>

          {data.error && (
            <div className="flex items-start gap-1 p-2 bg-red-50 text-red-600 text-[10px] rounded border border-red-100 mt-2">
              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{data.error}</span>
            </div>
          )}

          {data.imageUrl && (
             <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 shadow-sm relative group bg-zinc-100 min-h-[100px] flex items-center justify-center">
              <img
                src={data.imageUrl}
                alt="Processed result"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <a href={data.imageUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium backdrop-blur-md transition-colors border border-white/10">
                  查看大图
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 border-[3px] border-white bg-purple-500"
      />
    </>
  );
}
