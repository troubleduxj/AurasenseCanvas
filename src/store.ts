import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

export type NodeType = 'textNode' | 'imageNode' | 'storyboardNode' | 'characterNode' | 'llmNode' | 'imageProcessNode';

export interface WorkflowState {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

interface AppState {
  workflows: WorkflowState[];
  currentWorkflowId: string;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  createWorkflow: (name: string) => void;
  switchWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  renameWorkflow: (id: string, newName: string) => void;
  previewImageUrl: string | null;
  setPreviewImageUrl: (url: string | null) => void;
  nodeHandlers: Record<string, () => Promise<void>>;
  registerNodeHandler: (id: string, handler: () => Promise<void>) => void;
  unregisterNodeHandler: (id: string) => void;
  isRunningAll: boolean;
  setIsRunningAll: (isRunning: boolean) => void;
  runAll: () => Promise<void>;
}

const defaultWorkflowId = 'default-1';

export const useStore = create<AppState>((set, get) => ({
  workflows: [
    {
      id: defaultWorkflowId,
      name: 'Untitled Workflow',
      nodes: [],
      edges: [],
    },
  ],
  currentWorkflowId: defaultWorkflowId,
  nodes: [],
  edges: [],
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    // Sync to current workflow
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === state.currentWorkflowId ? { ...w, nodes: state.nodes } : w
      ),
    }));
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    // Sync to current workflow
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === state.currentWorkflowId ? { ...w, edges: state.edges } : w
      ),
    }));
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
    // Sync to current workflow
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === state.currentWorkflowId ? { ...w, edges: state.edges } : w
      ),
    }));
  },
  setNodes: (nodes: Node[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),
  addNode: (node: Node) =>
    set((state) => {
      const newNodes = [...state.nodes, node];
      return {
        nodes: newNodes,
        workflows: state.workflows.map((w) =>
          w.id === state.currentWorkflowId ? { ...w, nodes: newNodes } : w
        ),
      };
    }),
  removeNode: (nodeId: string) =>
    set((state) => {
      const newNodes = state.nodes.filter((n) => n.id !== nodeId);
      const newEdges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      return {
        nodes: newNodes,
        edges: newEdges,
        workflows: state.workflows.map((w) =>
          w.id === state.currentWorkflowId ? { ...w, nodes: newNodes, edges: newEdges } : w
        ),
      };
    }),
  removeEdge: (edgeId: string) =>
    set((state) => {
      const newEdges = state.edges.filter((e) => e.id !== edgeId);
      return {
        edges: newEdges,
        workflows: state.workflows.map((w) =>
          w.id === state.currentWorkflowId ? { ...w, edges: newEdges } : w
        ),
      };
    }),
  updateNodeData: (nodeId: string, data: any) =>
    set((state) => {
      const newNodes = state.nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, ...data } };
        }
        return n;
      });
      return {
        nodes: newNodes,
        workflows: state.workflows.map((w) =>
          w.id === state.currentWorkflowId ? { ...w, nodes: newNodes } : w
        ),
      };
    }),
  createWorkflow: (name: string) =>
    set((state) => {
      const id = Date.now().toString();
      const newWorkflow = { id, name, nodes: [], edges: [] };
      return {
        workflows: [...state.workflows, newWorkflow],
        currentWorkflowId: id,
        nodes: [],
        edges: [],
      };
    }),
  switchWorkflow: (id: string) =>
    set((state) => {
      const workflow = state.workflows.find((w) => w.id === id);
      if (!workflow) return state;
      return {
        currentWorkflowId: id,
        nodes: workflow.nodes,
        edges: workflow.edges,
      };
    }),
  deleteWorkflow: (id: string) =>
    set((state) => {
      if (state.workflows.length <= 1) return state; // Prevent deleting the last one
      const newWorkflows = state.workflows.filter((w) => w.id !== id);
      const nextCurrentId = state.currentWorkflowId === id ? newWorkflows[0].id : state.currentWorkflowId;
      const nextWorkflow = newWorkflows.find((w) => w.id === nextCurrentId)!;
      return {
        workflows: newWorkflows,
        currentWorkflowId: nextCurrentId,
        nodes: nextWorkflow.nodes,
        edges: nextWorkflow.edges,
      };
    }),
  renameWorkflow: (id: string, newName: string) =>
    set((state) => ({
      workflows: state.workflows.map((w) => (w.id === id ? { ...w, name: newName } : w)),
    })),
  previewImageUrl: null,
  setPreviewImageUrl: (url: string | null) => set({ previewImageUrl: url }),
  nodeHandlers: {},
  registerNodeHandler: (id, handler) => {
    set((state) => ({
      nodeHandlers: { ...state.nodeHandlers, [id]: handler },
    }));
  },
  unregisterNodeHandler: (id) => {
    set((state) => {
      const newHandlers = { ...state.nodeHandlers };
      delete newHandlers[id];
      return { nodeHandlers: newHandlers };
    });
  },
  isRunningAll: false,
  setIsRunningAll: (isRunning) => set({ isRunningAll: isRunning }),
  runAll: async () => {
    const { nodes, edges, nodeHandlers, setIsRunningAll } = get();
    if (nodes.length === 0) return;
    
    setIsRunningAll(true);
    
    try {
      // Topological sort
      const adjacencyList = new Map<string, string[]>();
      const inDegree = new Map<string, number>();

      nodes.forEach(n => {
        adjacencyList.set(n.id, []);
        inDegree.set(n.id, 0);
      });

      edges.forEach(e => {
        adjacencyList.get(e.source)?.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      });

      const queue: string[] = [];
      inDegree.forEach((degree, id) => {
        if (degree === 0) queue.push(id);
      });

      const order: string[] = [];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        order.push(curr);
        adjacencyList.get(curr)?.forEach(neighbor => {
          inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
          if (inDegree.get(neighbor) === 0) {
            queue.push(neighbor);
          }
        });
      }

      // Execute in order
      for (const nodeId of order) {
        const handler = nodeHandlers[nodeId];
        if (handler) {
          try {
            await handler();
          } catch (err) {
            console.error(`Node ${nodeId} execution failed:`, err);
            // Optionally stop on first error
            break; 
          }
        }
      }
    } finally {
      setIsRunningAll(false);
    }
  }
}));
