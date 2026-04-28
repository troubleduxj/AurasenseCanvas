import { ReactFlow, Background, Controls, MiniMap, NodeTypes, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../store";
import { useCallback, useRef, DragEvent, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { NodeType } from "../store";
import { Play, Loader2 } from "lucide-react";

import { TextNode } from "./nodes/TextNode";
import { ImageNode } from "./nodes/ImageNode";
import { StoryboardNode } from "./nodes/StoryboardNode";
import { CharacterNode } from "./nodes/CharacterNode";
import { LLMNode } from "./nodes/LLMNode";
import { ImageProcessNode } from "./nodes/ImageProcessNode";
import { DeletableEdge } from "./DeletableEdge";

const nodeTypes: NodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  storyboardNode: StoryboardNode,
  characterNode: CharacterNode,
  llmNode: LLMNode,
  imageProcessNode: ImageProcessNode,
};

const edgeTypes = {
  deletableEdge: DeletableEdge,
};

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, runAll, isRunningAll } =
    useStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "application/reactflow",
      ) as NodeType;

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: uuidv4(),
        type,
        position,
        data: {}, // Initialize with empty specific data if needed later
      };

      addNode(newNode);
    },
    [addNode, screenToFlowPosition],
  );

  const edgesWithAnimation = useMemo(() => {
    return edges.map((edge) => {
      const targetNode = nodes.find((n) => n.id === edge.target);
      const isGenerating = targetNode?.data?.isGenerating === true;
      return {
        ...edge,
        type: 'deletableEdge',
        animated: isGenerating,
        style: isGenerating ? { stroke: '#3b82f6', strokeWidth: 2 } : edge.style,
      };
    });
  }, [edges, nodes]);

  return (
    <div className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edgesWithAnimation}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.2}
        maxZoom={3}
        className="bg-zinc-100/80"
      >
        <Background color="#d4d4d8" gap={20} size={1.5} />
        <Controls />
        <MiniMap
          className="rounded-lg shadow-sm"
          zoomable
          pannable
          nodeColor="#e4e4e7"
          maskColor="rgba(250, 250, 250, 0.7)"
        />
        
        {/* Run All Top-Right UI */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => runAll()}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold text-sm disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isRunningAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            {isRunningAll ? "全局运行中..." : "一键全局运行"}
          </button>
        </div>
      </ReactFlow>
    </div>
  );
}
