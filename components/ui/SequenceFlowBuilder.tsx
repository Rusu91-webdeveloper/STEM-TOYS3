"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Plus,
  Mail,
  Clock,
  Zap,
  Trash2,
  Edit3,
  Play,
  Pause,
  Settings,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Info,
  Target,
  Users,
  Calendar,
  Filter,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Types for the sequence flow
export interface SequenceNode {
  id: string;
  type:
    | "trigger"
    | "email"
    | "delay"
    | "condition"
    | "action"
    | "split"
    | "merge";
  title: string;
  description?: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  status: "active" | "inactive" | "error" | "pending";
  nextNodes: string[];
  prevNodes: string[];
}

export interface SequenceConnection {
  id: string;
  from: string;
  to: string;
  type: "success" | "failure" | "default";
  label?: string;
}

export interface SequenceFlowData {
  nodes: SequenceNode[];
  connections: SequenceConnection[];
  metadata: {
    name: string;
    description?: string;
    triggerType: "immediate" | "scheduled" | "event" | "manual";
    isActive: boolean;
  };
}

interface SequenceFlowBuilderProps {
  initialData?: SequenceFlowData;
  onSave: (data: SequenceFlowData) => void;
  onTest?: (data: SequenceFlowData) => void;
  className?: string;
}

// Node types configuration
const NODE_TYPES = {
  trigger: {
    icon: Zap,
    label: "Trigger",
    color: "bg-blue-500",
    description: "Start the sequence",
  },
  email: {
    icon: Mail,
    label: "Email",
    color: "bg-green-500",
    description: "Send an email",
  },
  delay: {
    icon: Clock,
    label: "Delay",
    color: "bg-yellow-500",
    description: "Wait for a period",
  },
  condition: {
    icon: Filter,
    label: "Condition",
    color: "bg-purple-500",
    description: "Branch based on conditions",
  },
  action: {
    icon: Target,
    label: "Action",
    color: "bg-orange-500",
    description: "Perform an action",
  },
  split: {
    icon: ArrowDown,
    label: "Split",
    color: "bg-indigo-500",
    description: "Split to multiple paths",
  },
  merge: {
    icon: ArrowRight,
    label: "Merge",
    color: "bg-teal-500",
    description: "Merge multiple paths",
  },
};

const TRIGGER_TYPES = [
  { value: "immediate", label: "Immediate", description: "Start immediately" },
  {
    value: "scheduled",
    label: "Scheduled",
    description: "Start at specific time",
  },
  { value: "event", label: "Event-based", description: "Start on user action" },
  { value: "manual", label: "Manual", description: "Start manually" },
];

export function SequenceFlowBuilder({
  initialData,
  onSave,
  onTest,
  className = "",
}: SequenceFlowBuilderProps) {
  const [flowData, setFlowData] = useState<SequenceFlowData>(
    initialData || {
      nodes: [],
      connections: [],
      metadata: {
        name: "New Sequence",
        triggerType: "immediate",
        isActive: false,
      },
    }
  );

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedNode: string | null;
    dragOffset: { x: number; y: number };
  }>({
    isDragging: false,
    draggedNode: null,
    dragOffset: { x: 0, y: 0 },
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Add a new node to the flow
  const addNode = useCallback(
    (type: SequenceNode["type"], position: { x: number; y: number }) => {
      const id = `${type}_${Date.now()}`;
      const newNode: SequenceNode = {
        id,
        type,
        title: NODE_TYPES[type].label,
        description: NODE_TYPES[type].description,
        config: {},
        position,
        status: "pending",
        nextNodes: [],
        prevNodes: [],
      };

      setFlowData(prev => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
      }));
    },
    []
  );

  // Update node configuration
  const updateNode = useCallback(
    (nodeId: string, updates: Partial<SequenceNode>) => {
      setFlowData(prev => ({
        ...prev,
        nodes: prev.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        ),
      }));
    },
    []
  );

  // Delete a node
  const deleteNode = useCallback((nodeId: string) => {
    setFlowData(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(
        conn => conn.from !== nodeId && conn.to !== nodeId
      ),
    }));
  }, []);

  // Add connection between nodes
  const addConnection = useCallback(
    (
      from: string,
      to: string,
      type: "success" | "failure" | "default" = "default"
    ) => {
      const connectionId = `conn_${from}_${to}_${Date.now()}`;
      const newConnection: SequenceConnection = {
        id: connectionId,
        from,
        to,
        type,
      };

      setFlowData(prev => ({
        ...prev,
        connections: [...prev.connections, newConnection],
        nodes: prev.nodes.map(node => {
          if (node.id === from) {
            return { ...node, nextNodes: [...node.nextNodes, to] };
          }
          if (node.id === to) {
            return { ...node, prevNodes: [...node.prevNodes, from] };
          }
          return node;
        }),
      }));
    },
    []
  );

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const node = flowData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDragState({
      isDragging: true,
      draggedNode: nodeId,
      dragOffset: {
        x: e.clientX - rect.left - node.position.x,
        y: e.clientY - rect.top - node.position.y,
      },
    });
  };

  // Handle drag move
  const handleDragMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedNode || !canvasRef.current)
      return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newPosition = {
      x: e.clientX - rect.left - dragState.dragOffset.x,
      y: e.clientY - rect.top - dragState.dragOffset.y,
    };

    updateNode(dragState.draggedNode, { position: newPosition });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedNode: null,
      dragOffset: { x: 0, y: 0 },
    });
  };

  // Render a connection line
  const renderConnection = (connection: SequenceConnection) => {
    const fromNode = flowData.nodes.find(n => n.id === connection.from);
    const toNode = flowData.nodes.find(n => n.id === connection.to);

    if (!fromNode || !toNode) return null;

    const fromX = fromNode.position.x + 100; // Node width / 2
    const fromY = fromNode.position.y + 40; // Node height / 2
    const toX = toNode.position.x + 100;
    const toY = toNode.position.y + 40;

    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    const path = `M ${fromX} ${fromY} Q ${midX} ${fromY} ${midX} ${midY} Q ${midX} ${toY} ${toX} ${toY}`;

    return (
      <g key={connection.id}>
        <path
          d={path}
          stroke={
            connection.type === "success"
              ? "#10b981"
              : connection.type === "failure"
                ? "#ef4444"
                : "#6b7280"
          }
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        {connection.label && (
          <text
            x={midX}
            y={midY - 5}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {connection.label}
          </text>
        )}
      </g>
    );
  };

  // Render a node
  const renderNode = (node: SequenceNode) => {
    const nodeType = NODE_TYPES[node.type];
    const IconComponent = nodeType.icon;

    return (
      <div
        key={node.id}
        className={cn(
          "absolute bg-white border-2 rounded-lg shadow-lg cursor-move transition-all duration-200 hover:shadow-xl",
          "w-48 h-20 flex flex-col justify-center items-center p-2",
          node.status === "active" && "border-green-500 bg-green-50",
          node.status === "error" && "border-red-500 bg-red-50",
          node.status === "pending" && "border-yellow-500 bg-yellow-50",
          selectedNode === node.id && "ring-2 ring-blue-500",
          dragState.isDragging &&
            dragState.draggedNode === node.id &&
            "opacity-50"
        )}
        style={{
          left: node.position.x,
          top: node.position.y,
        }}
        onMouseDown={e => handleDragStart(e, node.id)}
        onClick={() => setSelectedNode(node.id)}
      >
        <div className="flex items-center gap-2 w-full">
          <div className={cn("p-1 rounded", nodeType.color)}>
            <IconComponent className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{node.title}</div>
            {node.description && (
              <div className="text-xs text-gray-500 truncate">
                {node.description}
              </div>
            )}
          </div>
        </div>

        {/* Node status indicator */}
        <div className="absolute -top-1 -right-1">
          {node.status === "active" && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
          {node.status === "error" && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          {node.status === "pending" && (
            <Clock className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Sequence Flow Builder</h3>
          <Badge variant={flowData.metadata.isActive ? "default" : "secondary"}>
            {flowData.metadata.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNode(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>

          {onTest && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTest(flowData)}
            >
              <Play className="w-4 h-4 mr-2" />
              Test
            </Button>
          )}

          <Button size="sm" onClick={() => onSave(flowData)}>
            <Send className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="w-full h-full bg-gray-100 relative"
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {/* SVG for connections */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
              </marker>
            </defs>
            {flowData.connections.map(renderConnection)}
          </svg>

          {/* Nodes */}
          <div style={{ zIndex: 2 }}>{flowData.nodes.map(renderNode)}</div>

          {/* Empty state */}
          {flowData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  Start Building Your Sequence
                </h3>
                <p className="text-sm mb-4">
                  Add nodes to create your email automation flow
                </p>
                <Button onClick={() => setIsAddingNode(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Node
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Node Dialog */}
      <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Node</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(NODE_TYPES).map(([type, config]) => {
              const IconComponent = config.icon;
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    addNode(type as SequenceNode["type"], {
                      x: Math.random() * (canvasSize.width - 200),
                      y: Math.random() * (canvasSize.height - 100),
                    });
                    setIsAddingNode(false);
                  }}
                >
                  <div className={cn("p-2 rounded", config.color)}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs text-gray-500">
                      {config.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Node Configuration Panel */}
      {selectedNode && (
        <div className="w-80 border-l bg-white p-4 overflow-y-auto">
          <NodeConfigurationPanel
            node={flowData.nodes.find(n => n.id === selectedNode)!}
            onUpdate={updates => updateNode(selectedNode, updates)}
            onDelete={() => {
              deleteNode(selectedNode);
              setSelectedNode(null);
            }}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}
    </div>
  );
}

// Node Configuration Panel Component
interface NodeConfigurationPanelProps {
  node: SequenceNode;
  onUpdate: (updates: Partial<SequenceNode>) => void;
  onDelete: () => void;
  onClose: () => void;
}

function NodeConfigurationPanel({
  node,
  onUpdate,
  onDelete,
  onClose,
}: NodeConfigurationPanelProps) {
  const nodeType = NODE_TYPES[node.type];
  const IconComponent = nodeType.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded", nodeType.color)}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-medium">{nodeType.label}</h4>
            <p className="text-sm text-gray-500">{nodeType.description}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={node.title}
            onChange={e => onUpdate({ title: e.target.value })}
            placeholder="Node title"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={node.description || ""}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder="Node description"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={node.status}
            onValueChange={value =>
              onUpdate({ status: value as SequenceNode["status"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Node-specific configuration */}
        {node.type === "email" && (
          <EmailNodeConfig node={node} onUpdate={onUpdate} />
        )}

        {node.type === "delay" && (
          <DelayNodeConfig node={node} onUpdate={onUpdate} />
        )}

        {node.type === "condition" && (
          <ConditionNodeConfig node={node} onUpdate={onUpdate} />
        )}

        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  );
}

// Email Node Configuration
function EmailNodeConfig({
  node,
  onUpdate,
}: {
  node: SequenceNode;
  onUpdate: (updates: Partial<SequenceNode>) => void;
}) {
  return (
    <div className="space-y-3">
      <h5 className="font-medium text-sm">Email Configuration</h5>

      <div>
        <Label htmlFor="email-template">Template</Label>
        <Select
          value={node.config.templateId || ""}
          onValueChange={value =>
            onUpdate({
              config: { ...node.config, templateId: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="welcome">Welcome Email</SelectItem>
            <SelectItem value="follow-up">Follow-up Email</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="email-subject">Subject Line</Label>
        <Input
          id="email-subject"
          value={node.config.subject || ""}
          onChange={e =>
            onUpdate({
              config: { ...node.config, subject: e.target.value },
            })
          }
          placeholder="Email subject"
        />
      </div>
    </div>
  );
}

// Delay Node Configuration
function DelayNodeConfig({
  node,
  onUpdate,
}: {
  node: SequenceNode;
  onUpdate: (updates: Partial<SequenceNode>) => void;
}) {
  return (
    <div className="space-y-3">
      <h5 className="font-medium text-sm">Delay Configuration</h5>

      <div>
        <Label htmlFor="delay-value">Delay Duration</Label>
        <Input
          id="delay-value"
          type="number"
          value={node.config.duration || ""}
          onChange={e =>
            onUpdate({
              config: { ...node.config, duration: parseInt(e.target.value) },
            })
          }
          placeholder="Duration"
        />
      </div>

      <div>
        <Label htmlFor="delay-unit">Time Unit</Label>
        <Select
          value={node.config.unit || "hours"}
          onValueChange={value =>
            onUpdate({
              config: { ...node.config, unit: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minutes">Minutes</SelectItem>
            <SelectItem value="hours">Hours</SelectItem>
            <SelectItem value="days">Days</SelectItem>
            <SelectItem value="weeks">Weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Condition Node Configuration
function ConditionNodeConfig({
  node,
  onUpdate,
}: {
  node: SequenceNode;
  onUpdate: (updates: Partial<SequenceNode>) => void;
}) {
  return (
    <div className="space-y-3">
      <h5 className="font-medium text-sm">Condition Configuration</h5>

      <div>
        <Label htmlFor="condition-field">Field</Label>
        <Select
          value={node.config.field || ""}
          onValueChange={value =>
            onUpdate({
              config: { ...node.config, field: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user.age">User Age</SelectItem>
            <SelectItem value="user.location">User Location</SelectItem>
            <SelectItem value="order.value">Order Value</SelectItem>
            <SelectItem value="subscription.status">
              Subscription Status
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="condition-operator">Operator</Label>
        <Select
          value={node.config.operator || ""}
          onValueChange={value =>
            onUpdate({
              config: { ...node.config, operator: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Not Equals</SelectItem>
            <SelectItem value="greater_than">Greater Than</SelectItem>
            <SelectItem value="less_than">Less Than</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="condition-value">Value</Label>
        <Input
          id="condition-value"
          value={node.config.value || ""}
          onChange={e =>
            onUpdate({
              config: { ...node.config, value: e.target.value },
            })
          }
          placeholder="Condition value"
        />
      </div>
    </div>
  );
}
