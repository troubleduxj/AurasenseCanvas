import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Clapperboard, Trash2, AlertCircle, Loader2, Sparkles, Download, Video } from "lucide-react";
import { useStore } from "../../store";
import { GoogleGenAI } from "@google/genai";

export function StoryboardNode({
  id,
  data,
}: {
  id: string;
  data: {
    description: string;
    duration: string;
    assetUrl?: string;
    isGenerating?: boolean;
    error?: string;
    model?: string;
  };
}) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const removeNode = useStore((state) => state.removeNode);
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const handleGenerateVideo = async () => {
    // Check if connected to an image node
    const connectedEdges = edges.filter((edge) => edge.target === id);
    const sourceNodes = connectedEdges.map((edge) => 
      nodes.find((n) => n.id === edge.source)
    ).filter(Boolean);

    const imageNode = sourceNodes.find((n) => n?.type === "imageNode");

    if (!imageNode || !imageNode.data.imageUrl) {
      updateNodeData(id, { error: "请在左侧连接一个生成好的图像节点！" });
      return;
    }

    updateNodeData(id, { isGenerating: true, error: undefined });

    const modelName = data.model || 'placeholder';

    // 提示用户正在使用模拟数据
    try {
      if (modelName === 'placeholder') {
        // 模拟生成视频的等待时间
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 使用一个占位视频代替实际的视频生成，因为免费环境 API Key 不支持视频生成
        const videoUrl = "https://www.w3schools.com/html/mov_bbb.mp4"; // 经典的 Big Buck Bunny 占位视频

        updateNodeData(id, {
          assetUrl: videoUrl,
          isGenerating: false,
        });
      } else {
        const dataUrl = imageNode.data.imageUrl as string;
        const isDataUrl = dataUrl.startsWith("data:");
        let base64Image = "";
        let mimeType = "image/jpeg";

        if (isDataUrl) {
          const parts = dataUrl.split(",");
          base64Image = parts[1];
          mimeType = parts[0].split(":")[1].split(";")[0];
        } else {
          updateNodeData(id, { error: "图像格式不正确（必须为 base64）。" });
          return;
        }

        if (typeof window !== "undefined" && (window as any).aistudio) {
          try {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
              await (window as any).aistudio.openSelectKey();
            }
          } catch (e) {
            console.warn("AI Studio API key selection failed", e);
          }
        }

        // `process.env.API_KEY` is injected after key selection per AI Studio docs
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key not found");
        
        const ai = new GoogleGenAI({ apiKey });

        let operation = await ai.models.generateVideos({
          model: modelName,
          prompt: data.description || 'Animate the image smoothly',
          image: {
            imageBytes: base64Image,
            mimeType: mimeType,
          },
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });

        // Poll for completion
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!downloadLink) {
          throw new Error("生成失败：未返回视频链接");
        }

        // Fetch the video data to create an object URL
        const videoResponse = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
          },
        });

        if (!videoResponse.ok) {
          throw new Error("下载视频失败");
        }

        const blob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(blob);

        updateNodeData(id, {
          assetUrl: videoUrl,
          isGenerating: false,
        });
      }
    } catch (err: any) {
      console.error("Generate video error:", err);
      updateNodeData(id, {
        isGenerating: false,
        error: "生成异常：" + (err.message || String(err)),
      });
    }
  };

  return (
    <Card className=" group relative">
      <CardHeader className="p-3 bg-amber-50/50 border-b border-amber-100/60 flex flex-row items-center space-y-0 gap-2 justify-between">
        <button onClick={() => removeNode(id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white border border-amber-200/80 flex items-center justify-center shadow-sm text-amber-500">
            <Clapperboard className="w-3.5 h-3.5" />
          </div>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Storyboard / Video
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div>
          <label className="text-[10px] uppercase text-amber-600/70 font-semibold mb-1 block tracking-wider">Model</label>
          <select 
            className="w-full p-2 text-xs text-zinc-800 bg-white border border-zinc-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200/60 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
            value={data.model || 'placeholder'}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
          >
            <option value="placeholder">模拟视频 (Mock)</option>
            <option value="veo-3.1-lite-generate-preview">Veo 3.1 Lite</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] uppercase text-amber-600/70 font-semibold mb-1 block tracking-wider">
              Description / Prompt
            </label>
            <textarea
              className="w-full h-12 p-2 text-xs text-zinc-800 bg-white border border-zinc-200/80 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-200/60 transition-all placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              placeholder="Scene description"
              value={data.description || ""}
              onChange={(e) =>
                updateNodeData(id, { description: e.target.value })
              }
            />
          </div>
          <div className="w-16">
            <label className="text-[10px] uppercase text-amber-600/70 font-semibold mb-1 block tracking-wider">
              Dur. (s)
            </label>
            <input
              type="text"
              className="w-full p-2 text-xs text-center text-zinc-800 bg-white border border-zinc-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200/60 transition-all placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              placeholder="0.0"
              value={data.duration || ""}
              onChange={(e) => updateNodeData(id, { duration: e.target.value })}
            />
          </div>
        </div>

        {data.error && (
          <div className="flex items-start gap-1 p-2 bg-red-50 text-red-600 text-[10px] rounded border border-red-100">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{data.error}</span>
          </div>
        )}

        <button
          onClick={handleGenerateVideo}
          disabled={data.isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 shadow-sm shadow-amber-500/20 disabled:opacity-50 transition-all"
        >
          {data.isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {data.isGenerating ? "Generating Video..." : "生成视频"}
        </button>

        {data.assetUrl ? (
          <div className="flex flex-col gap-2 mt-2">
            <div className="w-full h-32 rounded-xl bg-zinc-950 overflow-hidden relative group border border-zinc-200/80 shadow-sm">
              <video
                src={data.assetUrl}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={() => {
                   const a = document.createElement('a');
                   a.href = data.assetUrl!;
                   a.download = 'generated-video.mp4';
                   a.click();
                 }}
                 className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-semibold rounded-lg hover:bg-amber-100 hover:text-amber-700 transition-all shadow-sm"
               >
                 <Download className="w-3 h-3" /> 下载
               </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-12 rounded-xl border border-dashed border-amber-300/60 bg-amber-50/50 flex flex-col items-center justify-center text-amber-600/50 text-xs">
            <Video className="w-4 h-4 mb-0.5 opacity-60" />
            <span className="text-[10px] font-medium tracking-wide">
              No Video Output
            </span>
          </div>
        )}
      </CardContent>
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 border-[3px] border-white bg-amber-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 border-[3px] border-white bg-amber-400"
      />
    </Card>
  );
}
