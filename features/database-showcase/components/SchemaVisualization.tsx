"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Search, Download, Maximize2 } from "lucide-react";
import { TableNode } from "./nodes/TableNode";
import { TableDetailsSidebar } from "./TableDetailsSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SchemaModel {
  name: string;
  fields: any[];
  indexes: string[];
  uniqueConstraints: string[];
  relations: any[];
  domain: string;
}

interface SchemaVisualizationProps {
  models: SchemaModel[];
  relations: any[];
  initialNodes: Node[];
  initialEdges: Edge[];
}

const nodeTypes = {
  table: TableNode,
};

export function SchemaVisualization({
  models,
  relations,
  initialNodes,
  initialEdges,
}: SchemaVisualizationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<SchemaModel | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;

    const query = searchQuery.toLowerCase();
    return nodes.map(node => {
      const matches =
        node.data.label.toLowerCase().includes(query) ||
        node.data.domain.toLowerCase().includes(query) ||
        node.data.fields.some((f: any) => f.name.toLowerCase().includes(query));

      return {
        ...node,
        style: {
          ...node.style,
          opacity: matches ? 1 : 0.2,
        },
      };
    });
  }, [nodes, searchQuery]);

  // Handle node click
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      const model = models.find(m => m.name === node.id);
      if (model) {
        setSelectedTable(model);
        setSidebarOpen(true);
      }
    },
    [models]
  );

  // Export as PNG
  const handleExport = useCallback(() => {
    const reactFlowInstance = document.querySelector(".react-flow");
    if (!reactFlowInstance) return;

    // Note: For full implementation, you'd use html2canvas or similar
    alert(
      "Export feature: You can implement this using html2canvas or the React Flow export utilities."
    );
  }, []);

  // Fit view
  const handleFitView = useCallback(() => {
    const fitViewButton = document.querySelector(
      '[data-testid="rf__controls-fitview"]'
    ) as HTMLButtonElement;
    if (fitViewButton) fitViewButton.click();
  }, []);

  // Get unique domains for filter badges
  const domains = useMemo(() => {
    const domainSet = new Set(models.map(m => m.domain));
    return Array.from(domainSet).sort();
  }, [models]);

  return (
    <div className="relative w-full h-[800px] border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tables, fields, or domains..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-white shadow-lg border-2"
          />
        </div>

        {/* Domain Filters */}
        <div className="hidden lg:flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg border-2">
          <span className="text-xs font-semibold text-gray-600">Domains:</span>
          {domains.slice(0, 5).map(domain => (
            <Badge
              key={domain}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-gray-100"
              onClick={() => setSearchQuery(domain)}
            >
              {domain}
            </Badge>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFitView}
            className="bg-white shadow-lg"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Fit View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="bg-white shadow-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg border-2 p-4 space-y-2">
        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
          Legend
        </h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-700">Authentication</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-green-500 rounded"></div>
            <span className="text-gray-700">E-commerce</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-amber-500 rounded"></div>
            <span className="text-gray-700">Suppliers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-purple-500 rounded"></div>
            <span className="text-gray-700">Multi-tenancy</span>
          </div>
        </div>
      </div>

      {/* Stats Badge */}
      <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg border-2 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {models.length}
            </div>
            <div className="text-xs text-gray-600">Tables</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {relations.length}
            </div>
            <div className="text-xs text-gray-600">Relations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {models.reduce((sum, m) => sum + m.indexes.length, 0)}
            </div>
            <div className="text-xs text-gray-600">Indexes</div>
          </div>
        </div>
      </div>

      {/* React Flow */}
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeColor={node => node.data.color}
          className="border-2 border-gray-300"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Details Sidebar */}
      <TableDetailsSidebar
        table={selectedTable}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
