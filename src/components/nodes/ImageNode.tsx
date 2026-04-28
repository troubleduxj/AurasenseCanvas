import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Image as ImageIcon, Wand2, Loader2, Download, Eye, AlertCircle, Trash2 } from "lucide-react";
import { useStore } from "../../store";
import { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

export function ImageNode({
  id,
  data,
}: {
  id: string;
  data: { prompt: string; imageUrl?: string; isGenerating?: boolean; model?: string; error?: string; uploadedImage?: string; aspectRatio?: string };
}) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const removeNode = useStore((state) => state.removeNode);
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);
  const setPreviewImageUrl = useStore((state) => state.setPreviewImageUrl);
  const registerNodeHandler = useStore((state) => state.registerNodeHandler);
  const unregisterNodeHandler = useStore((state) => state.unregisterNodeHandler);

  const handleGenerate = async () => {
    // Check if connected to a text node
    const connectedEdges = edges.filter((edge) => edge.target === id);
    const hasTextNodeInput = connectedEdges.some((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      return sourceNode?.type === "textNode" || sourceNode?.type === "llmNode";
    });

    if (!hasTextNodeInput) {
      updateNodeData(id, { error: "请在左侧连接文本或LLM节点！" });
      throw new Error("Missing text input node");
    }

    // Get the prompt text
    let nodePrompt = data.prompt || "";
    for (const edge of connectedEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode?.type === "textNode" && sourceNode.data.text) {
        nodePrompt = sourceNode.data.text + " " + nodePrompt;
      } else if (sourceNode?.type === "llmNode" && sourceNode.data.outputText) {
        nodePrompt = sourceNode.data.outputText + " " + nodePrompt;
      }
    }

    if (!nodePrompt.trim()) {
      updateNodeData(id, { error: "连接的节点内容不能为空" });
      throw new Error("Empty prompt from text input node");
    }

    updateNodeData(id, { isGenerating: true, error: undefined });

    try {
      const modelName = data.model || "placeholder";

      if (modelName === "placeholder") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const randomWidth = data.aspectRatio === "16:9" ? 512 : data.aspectRatio === "9:16" ? 288 : data.aspectRatio === "4:3" ? 512 : 400;
        const randomHeight = data.aspectRatio === "16:9" ? 288 : data.aspectRatio === "9:16" ? 512 : data.aspectRatio === "4:3" ? 384 : 400;
        const randomId = Math.floor(Math.random() * 1000);
        updateNodeData(id, {
          imageUrl: `https://picsum.photos/seed/${randomId}/${randomWidth}/${randomHeight}`,
          isGenerating: false,
        });
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

      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });

      const parts: any[] = [{ text: nodePrompt }];
      if (data.uploadedImage) {
        const isDataUrl = data.uploadedImage.startsWith("data:");
        if (isDataUrl) {
          const split = data.uploadedImage.split(",");
          const base64Image = split[1];
          const mimeType = split[0].split(":")[1].split(";")[0];
          parts.push({
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            }
          });
        }
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
            aspectRatio: data.aspectRatio || "1:1",
            imageSize: "1K",
          },
        } as any, // Cast to any to avoid TS errors if types are slightly outdated
      });

      let imageBase64 = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          break;
        }
      }

      if (imageBase64) {
        updateNodeData(id, {
          imageUrl: `data:image/jpeg;base64,${imageBase64}`,
          isGenerating: false,
        });
      } else {
        const errMsg = "生成失败：未返回图片";
        updateNodeData(id, {
          isGenerating: false,
          error: errMsg,
        });
        throw new Error(errMsg);
      }
    } catch (err: any) {
      console.error("Generate image error:", err);
      updateNodeData(id, {
        isGenerating: false,
        error: "生成异常：" + (err.message || String(err)),
      });
      throw err;
    }
  };

  useEffect(() => {
    registerNodeHandler(id, handleGenerate);
    return () => unregisterNodeHandler(id);
  }, [id, edges, nodes, data.model, data.aspectRatio, data.uploadedImage, data.prompt]); 

  return (
    <Card className=" group relative">
      <CardHeader className="p-3 bg-indigo-50/50 border-b border-indigo-100/60 flex flex-row items-center space-y-0 gap-2">
        <button onClick={() => removeNode(id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-6 h-6 rounded-md bg-white border border-indigo-200/80 flex items-center justify-center shadow-sm text-indigo-500">
          <ImageIcon className="w-3.5 h-3.5" />
        </div>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Image Gen
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] uppercase text-indigo-600/70 font-semibold mb-1 block tracking-wider">Model</label>
            <select 
              className="w-full p-2 text-xs text-zinc-800 bg-white border border-zinc-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200/60 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              value={data.model || 'placeholder'}
              onChange={(e) => updateNodeData(id, { model: e.target.value })}
            >
              <option value="placeholder">模拟图像 (Mock)</option>
              <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
              <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image Preview</option>
            </select>
          </div>
          
          <div className="w-20">
            <label className="text-[10px] uppercase text-indigo-600/70 font-semibold mb-1 block tracking-wider">比例</label>
            <select 
              className="w-full p-2 text-xs text-zinc-800 bg-white border border-zinc-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200/60 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              value={data.aspectRatio || '1:1'}
              onChange={(e) => updateNodeData(id, { aspectRatio: e.target.value })}
            >
              <option value="1:1">1:1</option>
              <option value="3:4">3:4</option>
              <option value="4:3">4:3</option>
              <option value="9:16">9:16</option>
              <option value="16:9">16:9</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="text-[10px] uppercase text-indigo-600/70 font-semibold mb-1 block tracking-wider">参考图 (可选)</label>
          <input 
            type="file" 
            accept="image/*"
            className="w-full text-[10px] text-zinc-600 file:mr-2 file:py-1 file:px-2 file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 rounded-lg border border-zinc-200/80 p-1 bg-white cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  updateNodeData(id, { uploadedImage: reader.result as string });
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          {data.uploadedImage && (
             <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-indigo-600">已上传参考图</span>
                <button onClick={() => updateNodeData(id, { uploadedImage: undefined })} className="text-[10px] text-red-500 hover:text-red-700">移除</button>
             </div>
          )}
        </div>
        
        <textarea
          className="w-full h-16 p-2.5 text-xs text-zinc-800 bg-white border border-zinc-200/80 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200/60 transition-all placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          placeholder="附加 Prompt (主要使用左侧文本)"
          value={data.prompt || ""}
          onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
        />
        
        {data.error && (
          <div className="flex items-start gap-1 p-2 bg-red-50 text-red-600 text-[10px] rounded border border-red-100">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{data.error}</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={data.isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600/90 text-white rounded-xl text-xs font-semibold hover:bg-indigo-600 shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-all"
        >
          {data.isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          {data.isGenerating ? "Synthesizing..." : "生成图片"}
        </button>
        {data.imageUrl && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="w-full h-32 rounded-xl bg-zinc-50 overflow-hidden border border-zinc-200/80 shadow-sm relative group">
              <img
                src={data.imageUrl}
                alt="Generated"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={() => setPreviewImageUrl(data.imageUrl || null)}
                 className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-white border border-zinc-200 text-zinc-600 text-[10px] font-semibold rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
               >
                 <Eye className="w-3 h-3" /> 预览
               </button>
               <button 
                 onClick={() => {
                   const a = document.createElement('a');
                   a.href = data.imageUrl!;
                   a.download = 'generated-image.jpg';
                   a.click();
                 }}
                 className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-semibold rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all shadow-sm"
               >
                 <Download className="w-3 h-3" /> 下载
               </button>
            </div>
          </div>
        )}
      </CardContent>
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 border-[3px] border-white bg-indigo-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 border-[3px] border-white bg-indigo-400"
      />
    </Card>
  );
}
