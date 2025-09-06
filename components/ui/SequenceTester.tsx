"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  Target,
  Zap,
  ArrowRight,
  Loader2,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SequenceFlowData, SequenceNode } from "./SequenceFlowBuilder";
import { cn } from "@/lib/utils";

interface TestUser {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  age?: number;
  location?: string;
  subscriptionStatus?: string;
  orderValue?: number;
  customFields: Record<string, any>;
}

interface TestStep {
  nodeId: string;
  node: SequenceNode;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

interface TestExecution {
  id: string;
  userId: string;
  user: TestUser;
  steps: TestStep[];
  status: "running" | "completed" | "failed" | "paused";
  startTime: Date;
  endTime?: Date;
  currentStepIndex: number;
}

interface SequenceTesterProps {
  sequence: SequenceFlowData;
  onClose?: () => void;
  className?: string;
}

// Sample test users
const SAMPLE_USERS: TestUser[] = [
  {
    id: "user_1",
    name: "John Doe",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    age: 28,
    location: "New York",
    subscriptionStatus: "active",
    orderValue: 150,
    customFields: { segment: "premium", source: "organic" },
  },
  {
    id: "user_2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    age: 35,
    location: "California",
    subscriptionStatus: "trial",
    orderValue: 75,
    customFields: { segment: "standard", source: "referral" },
  },
  {
    id: "user_3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    firstName: "Bob",
    lastName: "Johnson",
    age: 42,
    location: "Texas",
    subscriptionStatus: "inactive",
    orderValue: 200,
    customFields: { segment: "premium", source: "paid" },
  },
];

export function SequenceTester({
  sequence,
  onClose,
  className = "",
}: SequenceTesterProps) {
  const [selectedUser, setSelectedUser] = useState<TestUser>(SAMPLE_USERS[0]);
  const [testExecutions, setTestExecutions] = useState<TestExecution[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecution, setCurrentExecution] =
    useState<TestExecution | null>(null);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  // Initialize test execution
  const startTest = async () => {
    if (!selectedUser || isRunning) return;

    const executionId = `exec_${Date.now()}`;
    const steps: TestStep[] = sequence.nodes.map(node => ({
      nodeId: node.id,
      node,
      status: "pending",
    }));

    const execution: TestExecution = {
      id: executionId,
      userId: selectedUser.id,
      user: selectedUser,
      steps,
      status: "running",
      startTime: new Date(),
      currentStepIndex: 0,
    };

    setCurrentExecution(execution);
    setTestExecutions(prev => [execution, ...prev]);
    setIsRunning(true);
    setExecutionLog([`🚀 Started test execution for ${selectedUser.name}`]);

    // Start executing steps
    await executeSteps(execution);
  };

  // Execute sequence steps
  const executeSteps = async (execution: TestExecution) => {
    const { steps } = execution;
    let currentIndex = 0;

    while (currentIndex < steps.length && execution.status === "running") {
      const step = steps[currentIndex];

      // Update step status to running
      updateStepStatus(execution.id, currentIndex, "running", new Date());
      addLog(`⚡ Executing step: ${step.node.title}`);

      // Simulate step execution
      await simulateStepExecution(step);

      // Check if step succeeded
      if (step.status === "completed") {
        addLog(`✅ Step completed: ${step.node.title}`);
        currentIndex++;
      } else if (step.status === "failed") {
        addLog(`❌ Step failed: ${step.node.title} - ${step.error}`);
        break;
      } else if (step.status === "skipped") {
        addLog(`⏭️ Step skipped: ${step.node.title}`);
        currentIndex++;
      }

      // Update execution progress
      updateExecutionProgress(execution.id, currentIndex);

      // Add delay between steps for realistic simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Mark execution as completed
    completeExecution(execution.id);
  };

  // Simulate step execution based on node type
  const simulateStepExecution = async (step: TestStep): Promise<void> => {
    const { node } = step;

    return new Promise(resolve => {
      setTimeout(
        () => {
          switch (node.type) {
            case "trigger":
              step.status = "completed";
              step.result = { triggered: true, timestamp: new Date() };
              break;

            case "email":
              // Simulate email sending
              const emailSent = Math.random() > 0.1; // 90% success rate
              if (emailSent) {
                step.status = "completed";
                step.result = {
                  emailId: `email_${Date.now()}`,
                  subject: node.config.subject || "Test Email",
                  sentAt: new Date(),
                  templateId: node.config.templateId,
                };
              } else {
                step.status = "failed";
                step.error = "Email service unavailable";
              }
              break;

            case "delay":
              // Simulate delay
              const delayMs =
                (node.config.duration || 1) *
                getDelayMultiplier(node.config.unit || "hours");
              step.status = "completed";
              step.result = {
                delayedFor: delayMs,
                delayedUntil: new Date(Date.now() + delayMs),
              };
              break;

            case "condition":
              // Simulate condition evaluation
              const conditionMet = evaluateCondition(node.config, selectedUser);
              if (conditionMet) {
                step.status = "completed";
                step.result = { conditionMet: true, path: "success" };
              } else {
                step.status = "skipped";
                step.result = { conditionMet: false, path: "failure" };
              }
              break;

            case "action":
              // Simulate action execution
              const actionSuccess = Math.random() > 0.05; // 95% success rate
              if (actionSuccess) {
                step.status = "completed";
                step.result = { action: "completed", timestamp: new Date() };
              } else {
                step.status = "failed";
                step.error = "Action execution failed";
              }
              break;

            default:
              step.status = "completed";
              step.result = { executed: true };
          }

          step.endTime = new Date();
          resolve();
        },
        Math.random() * 2000 + 500
      ); // Random delay between 500ms and 2.5s
    });
  };

  // Evaluate condition based on user data
  const evaluateCondition = (
    config: Record<string, any>,
    user: TestUser
  ): boolean => {
    const { field, operator, value } = config;

    let userValue: any;
    switch (field) {
      case "user.age":
        userValue = user.age;
        break;
      case "user.location":
        userValue = user.location;
        break;
      case "order.value":
        userValue = user.orderValue;
        break;
      case "subscription.status":
        userValue = user.subscriptionStatus;
        break;
      default:
        userValue = user.customFields[field] || null;
    }

    switch (operator) {
      case "equals":
        return userValue === value;
      case "not_equals":
        return userValue !== value;
      case "greater_than":
        return Number(userValue) > Number(value);
      case "less_than":
        return Number(userValue) < Number(value);
      case "contains":
        return String(userValue)
          .toLowerCase()
          .includes(String(value).toLowerCase());
      default:
        return false;
    }
  };

  // Get delay multiplier based on unit
  const getDelayMultiplier = (unit: string): number => {
    switch (unit) {
      case "minutes":
        return 60 * 1000;
      case "hours":
        return 60 * 60 * 1000;
      case "days":
        return 24 * 60 * 60 * 1000;
      case "weeks":
        return 7 * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  };

  // Update step status
  const updateStepStatus = (
    executionId: string,
    stepIndex: number,
    status: TestStep["status"],
    startTime?: Date
  ) => {
    setTestExecutions(prev =>
      prev.map(execution => {
        if (execution.id === executionId) {
          const updatedSteps = [...execution.steps];
          updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            status,
            startTime: startTime || updatedSteps[stepIndex].startTime,
          };
          return { ...execution, steps: updatedSteps };
        }
        return execution;
      })
    );

    if (currentExecution?.id === executionId) {
      setCurrentExecution(prev => {
        if (!prev) return null;
        const updatedSteps = [...prev.steps];
        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          status,
          startTime: startTime || updatedSteps[stepIndex].startTime,
        };
        return { ...prev, steps: updatedSteps };
      });
    }
  };

  // Update execution progress
  const updateExecutionProgress = (
    executionId: string,
    currentStepIndex: number
  ) => {
    setTestExecutions(prev =>
      prev.map(execution => {
        if (execution.id === executionId) {
          return { ...execution, currentStepIndex };
        }
        return execution;
      })
    );

    if (currentExecution?.id === executionId) {
      setCurrentExecution(prev =>
        prev ? { ...prev, currentStepIndex } : null
      );
    }
  };

  // Complete execution
  const completeExecution = (executionId: string) => {
    setTestExecutions(prev =>
      prev.map(execution => {
        if (execution.id === executionId) {
          const completedSteps = execution.steps.filter(
            step => step.status === "completed"
          ).length;
          const status =
            completedSteps === execution.steps.length ? "completed" : "failed";
          addLog(
            `🏁 Test execution ${status}: ${completedSteps}/${execution.steps.length} steps completed`
          );
          return { ...execution, status, endTime: new Date() };
        }
        return execution;
      })
    );

    setIsRunning(false);
    setCurrentExecution(null);
  };

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setExecutionLog(prev => [
      `[${timestamp}] ${message}`,
      ...prev.slice(0, 99),
    ]); // Keep last 100 entries
  };

  // Stop current test
  const stopTest = () => {
    if (currentExecution) {
      completeExecution(currentExecution.id);
      addLog("🛑 Test execution stopped by user");
    }
  };

  // Reset tests
  const resetTests = () => {
    setTestExecutions([]);
    setCurrentExecution(null);
    setExecutionLog([]);
    setIsRunning(false);
  };

  // Get step status icon
  const getStepStatusIcon = (status: TestStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "skipped":
        return <ArrowRight className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get step status color
  const getStepStatusColor = (status: TestStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "failed":
        return "bg-red-50 border-red-200";
      case "running":
        return "bg-blue-50 border-blue-200";
      case "skipped":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className={cn("w-full max-w-6xl mx-auto space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sequence Tester</h2>
          <p className="text-gray-600">
            Test your email sequence with sample data
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
          <Button variant="outline" onClick={resetTests}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">Test Configuration</TabsTrigger>
          <TabsTrigger value="execution">Live Execution</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-user">Test User</Label>
                <Select
                  value={selectedUser.id}
                  onValueChange={value => {
                    const user = SAMPLE_USERS.find(u => u.id === value);
                    if (user) setSelectedUser(user);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_USERS.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User Details</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>
                      <strong>Name:</strong> {selectedUser.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedUser.email}
                    </div>
                    <div>
                      <strong>Age:</strong> {selectedUser.age || "N/A"}
                    </div>
                    <div>
                      <strong>Location:</strong>{" "}
                      {selectedUser.location || "N/A"}
                    </div>
                    <div>
                      <strong>Subscription:</strong>{" "}
                      {selectedUser.subscriptionStatus || "N/A"}
                    </div>
                    <div>
                      <strong>Order Value:</strong> $
                      {selectedUser.orderValue || 0}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Sequence Overview</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>
                      <strong>Steps:</strong> {sequence.nodes.length}
                    </div>
                    <div>
                      <strong>Paths:</strong> {sequence.connections.length}
                    </div>
                    <div>
                      <strong>Trigger:</strong> {sequence.metadata.triggerType}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      {sequence.metadata.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={startTest}
                  disabled={isRunning}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Test...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Test
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          {currentExecution ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Execution</span>
                  <Badge
                    variant={
                      currentExecution.status === "running"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {currentExecution.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{currentExecution.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {currentExecution.startTime.toLocaleTimeString()}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={stopTest}>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>
                      {currentExecution.currentStepIndex + 1} /{" "}
                      {currentExecution.steps.length}
                    </span>
                  </div>
                  <Progress
                    value={
                      ((currentExecution.currentStepIndex + 1) /
                        currentExecution.steps.length) *
                      100
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  {currentExecution.steps.map((step, index) => (
                    <div
                      key={step.nodeId}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        getStepStatusColor(step.status)
                      )}
                    >
                      {getStepStatusIcon(step.status)}
                      <div className="flex-1">
                        <div className="font-medium">{step.node.title}</div>
                        {step.result && (
                          <div className="text-sm text-gray-600 mt-1">
                            {JSON.stringify(step.result, null, 2)}
                          </div>
                        )}
                        {step.error && (
                          <div className="text-sm text-red-600 mt-1">
                            {step.error}
                          </div>
                        )}
                      </div>
                      {step.startTime && (
                        <div className="text-xs text-gray-500">
                          {step.startTime.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">
                  No active test execution
                </h3>
                <p className="text-gray-600">
                  Start a test to see live execution details
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid gap-4">
            {testExecutions.map(execution => (
              <Card key={execution.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{execution.user.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          execution.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {execution.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {execution.startTime.toLocaleString()}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Completed Steps</span>
                      <span>
                        {
                          execution.steps.filter(s => s.status === "completed")
                            .length
                        }{" "}
                        / {execution.steps.length}
                      </span>
                    </div>
                    <Progress
                      value={
                        (execution.steps.filter(s => s.status === "completed")
                          .length /
                          execution.steps.length) *
                        100
                      }
                      className="h-2"
                    />

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {
                            execution.steps.filter(
                              s => s.status === "completed"
                            ).length
                          }
                        </div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {
                            execution.steps.filter(s => s.status === "failed")
                              .length
                          }
                        </div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600">
                          {
                            execution.steps.filter(s => s.status === "skipped")
                              .length
                          }
                        </div>
                        <div className="text-xs text-gray-600">Skipped</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {
                            execution.steps.filter(s => s.status === "running")
                              .length
                          }
                        </div>
                        <div className="text-xs text-gray-600">Running</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {testExecutions.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">
                  No test results yet
                </h3>
                <p className="text-gray-600">
                  Run a test to see detailed results
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {executionLog.length === 0 ? (
                  <div className="text-gray-500">
                    No logs yet. Start a test to see execution logs.
                  </div>
                ) : (
                  executionLog.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
