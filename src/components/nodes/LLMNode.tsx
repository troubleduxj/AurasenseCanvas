import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Bot, Wand2, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { useStore } from "../../store";
import { GoogleGenAI } from "@google/genai";
import { useEffect } from "react";

export function LLMNode({
  id,
  data,
}: {
  id: string;
  data: {
    systemPrompt?: string;
    outputText?: string;
    isGenerating?: boolean;
    error?: string;
    model?: string;
  };
}) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const removeNode = useStore((state) => state.removeNode);
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);
  const registerNodeHandler = useStore((state) => state.registerNodeHandler);
  const unregisterNodeHandler = useStore((state) => state.unregisterNodeHandler);

  const handleGenerate = async () => {
    // Check if connected to a text node
    const connectedEdges = edges.filter((edge) => edge.target === id);
    const hasTextNodeInput = connectedEdges.some((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      return sourceNode?.type === "textNode";
    });

    // Gather input
    let inputText = "";
    for (const edge of connectedEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode?.type === "textNode" && sourceNode.data.text) {
        inputText += sourceNode.data.text + " ";
      }
    }

    if (!inputText.trim()) {
      updateNodeData(id, { error: "需在左侧连接文本节点提供输入" });
      throw new Error("Missing input");
    }

    updateNodeData(id, { isGenerating: true, error: undefined, outputText: undefined });

    try {
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

      const modelName = data.model || "gemini-3.1-pro-preview";
      const systemPrompt = data.systemPrompt || "You are an expert prompt engineer. Enhance the user's input into a highly detailed, descriptive image generation prompt in English. Output ONLY the final prompt, without any explanations, markdown, or introductory text. Use comma-separated descriptive keywords where appropriate.";

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: inputText }],
        },
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const generatedText = response.text || "";

      if (generatedText) {
        updateNodeData(id, {
          outputText: generatedText,
          isGenerating: false,
        });
      } else {
        const errMsg = "生成失败：未返回结果";
        updateNodeData(id, {
          isGenerating: false,
          error: errMsg,
        });
        throw new Error(errMsg);
      }
    } catch (err: any) {
      console.error("Generate text error:", err);
      updateNodeData(id, {
        isGenerating: false,
        error: "生成异常：" + (err.message || String(err)),
      });
      throw err;
    }
  };

  useEffect(() => {
    registerNodeHandler(id, handleGenerate);
    // Needs to be unregistered when component unmounts
    return () => unregisterNodeHandler(id);
  }, [id, edges, nodes, data.model, data.systemPrompt]); // Need dependencies so closure remains up to date

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 border-[3px] border-white bg-blue-500"
      />
      <Card className=" group relative">
        <CardHeader className="p-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl">
        <button onClick={() => removeNode(id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
          <CardTitle className="text-xs font-semibold flex items-center gap-2 text-zinc-700">
            <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
              <Bot className="w-3.5 h-3.5" />
            </div>
            LLM / 提示词扩写
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div>
            <label className="text-[10px] uppercase text-blue-600/70 font-semibold mb-1 block tracking-wider">Model</label>
            <select 
              className="w-full p-2 text-xs text-zinc-800 bg-white border border-zinc-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200/60 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              value={data.model || 'gemini-3.1-pro-preview'}
              onChange={(e) => updateNodeData(id, { model: e.target.value })}
            >
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
              <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash Preview</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>

          <textarea
            className="w-full h-16 p-2.5 text-xs text-zinc-800 bg-white border border-zinc-200/80 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-200/60 transition-all placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
            placeholder="系统提示词 (例如: 扩写为详细的纯英文英文绘图提示词，不要额外解释)"
            value={data.systemPrompt || ""}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
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
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {data.isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            {data.isGenerating ? "生成中..." : "执行扩写"}
          </button>

          {data.outputText !== undefined && (
            <div className="mt-3">
              <label className="text-[10px] uppercase text-blue-600/70 font-semibold mb-1 block tracking-wider">输出结果 (可编辑)</label>
              <textarea
                className="w-full h-32 p-2.5 text-xs text-zinc-800 bg-zinc-50 border border-zinc-200/80 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-200/60 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] whitespace-pre-wrap"
                value={data.outputText}
                onChange={(e) => updateNodeData(id, { outputText: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 border-[3px] border-white bg-blue-500"
      />
    </>
  );
}
