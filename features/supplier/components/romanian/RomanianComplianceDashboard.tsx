"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  Shield,
  Award,
  TrendingUp,
  Download,
  Upload,
} from "lucide-react";
import { RomanianFeatures } from "./RomanianFeatures";
import {
  RomanianComplianceStatus as ComplianceStatusEnum,
  getRomanianComplianceStatusColor,
  getRomanianEducationalLevelLabel,
} from "@/types/romanian";

interface ComplianceRequirement {
  field: string;
  label: string;
  description: string;
  status: "completed" | "pending";
  required: boolean;
}

interface ComplianceData {
  complianceStatus: string;
  complianceScore: number;
  completedFields: number;
  totalFields: number;
  requirements: ComplianceRequirement[];
  details: {
    anpcApproval?: boolean;
    iscApproval?: boolean;
    educationalCertification?: string;
    cui?: string;
    nrRegCom?: string;
    codFiscal?: string;
    romanianVatNumber?: string;
    romanianBankAccount?: string;
  };
}

interface RomanianComplianceDashboardProps {
  supplier: {
    businessCountry: string;
  };
}

export function RomanianComplianceDashboard({
  supplier,
}: RomanianComplianceDashboardProps) {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchComplianceStatus();
  }, []);

  const fetchComplianceStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/supplier/romanian/compliance-status");

      if (!response.ok) {
        throw new Error("Failed to fetch compliance status");
      }

      const data = await response.json();

      // Transform API response to match component's expected format
      const transformedData: ComplianceData = {
        complianceStatus: data.romanianComplianceStatus || "PENDING",
        complianceScore: calculateComplianceScore(data),
        completedFields: calculateCompletedFields(data),
        totalFields: 8, // Total number of compliance fields
        requirements: generateRequirements(data),
        details: {
          anpcApproval: data.anpcApproval,
          iscApproval: data.iscApproval,
          educationalCertification: data.educationalCertification,
          cui: data.cui,
          nrRegCom: data.nrRegCom,
          codFiscal: data.codFiscal,
          romanianVatNumber: data.romanianVatNumber,
          romanianBankAccount: data.romanianBankAccount,
        },
      };

      setComplianceData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateComplianceStatus = async (
    field: string,
    value: boolean | string
  ) => {
    try {
      setUpdating(true);
      const response = await fetch("/api/supplier/romanian/compliance-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update compliance status");
      }

      // Refresh compliance data
      await fetchComplianceStatus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update compliance status"
      );
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Helper functions to transform API data
  const calculateComplianceScore = (data: any): number => {
    let completed = 0;
    const total = 8;

    if (data.anpcApproval) completed++;
    if (data.iscApproval) completed++;
    if (data.educationalCertification) completed++;
    if (data.cui) completed++;
    if (data.nrRegCom) completed++;
    if (data.codFiscal) completed++;
    if (data.romanianVatNumber) completed++;
    if (data.romanianBankAccount) completed++;

    return Math.round((completed / total) * 100);
  };

  const calculateCompletedFields = (data: any): number => {
    let completed = 0;

    if (data.anpcApproval) completed++;
    if (data.iscApproval) completed++;
    if (data.educationalCertification) completed++;
    if (data.cui) completed++;
    if (data.nrRegCom) completed++;
    if (data.codFiscal) completed++;
    if (data.romanianVatNumber) completed++;
    if (data.romanianBankAccount) completed++;

    return completed;
  };

  const generateRequirements = (data: any): ComplianceRequirement[] => {
    return [
      {
        field: "anpcApproval",
        label: "ANPC Approval",
        description:
          "Approval from the National Authority for Consumer Protection",
        status: data.anpcApproval ? "completed" : "pending",
        required: true,
      },
      {
        field: "iscApproval",
        label: "ISC Approval",
        description: "Approval from the State Inspectorate for Construction",
        status: data.iscApproval ? "completed" : "pending",
        required: true,
      },
      {
        field: "educationalCertification",
        label: "Educational Certification",
        description:
          "Ministry of Education certification for educational products",
        status: data.educationalCertification ? "completed" : "pending",
        required: false,
      },
      {
        field: "cui",
        label: "CUI (Tax ID)",
        description: "Unique Registration Code for Romanian businesses",
        status: data.cui ? "completed" : "pending",
        required: true,
      },
      {
        field: "nrRegCom",
        label: "Nr. Reg. Com.",
        description: "Trade Register Number",
        status: data.nrRegCom ? "completed" : "pending",
        required: true,
      },
      {
        field: "codFiscal",
        label: "Cod Fiscal",
        description: "Fiscal Code for Romanian businesses",
        status: data.codFiscal ? "completed" : "pending",
        required: true,
      },
      {
        field: "romanianVatNumber",
        label: "Romanian VAT Number",
        description: "VAT registration number for Romanian operations",
        status: data.romanianVatNumber ? "completed" : "pending",
        required: true,
      },
      {
        field: "romanianBankAccount",
        label: "Romanian Bank Account",
        description: "Bank account details for Romanian transactions",
        status: data.romanianBankAccount ? "completed" : "pending",
        required: true,
      },
    ];
  };

  if (loading) {
    return (
      <RomanianFeatures supplier={supplier}>
        <Card>
          <CardHeader>
            <CardTitle>Romanian Compliance Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </RomanianFeatures>
    );
  }

  if (error) {
    return (
      <RomanianFeatures supplier={supplier}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </RomanianFeatures>
    );
  }

  if (!complianceData) {
    return (
      <RomanianFeatures supplier={supplier}>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No compliance data available. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </RomanianFeatures>
    );
  }

  return (
    <RomanianFeatures supplier={supplier}>
      <div className="space-y-6">
        {/* Compliance Overview */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-900">
                Compliance Overview
              </CardTitle>
              <Badge
                variant="outline"
                className={getRomanianComplianceStatusColor(
                  complianceData.complianceStatus as ComplianceStatusEnum
                )}
              >
                {complianceData.complianceStatus
                  ? complianceData.complianceStatus.replace("_", " ")
                  : "PENDING"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Compliance Score</span>
                  <span>{complianceData.complianceScore}%</span>
                </div>
                <Progress
                  value={complianceData.complianceScore}
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground">
                  {complianceData.completedFields} of{" "}
                  {complianceData.totalFields} requirements completed
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">
                    {complianceData.completedFields}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-yellow-600">
                    {complianceData.totalFields -
                      complianceData.completedFields}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">
                    {complianceData.requirements.filter(r => r.required).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Required</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Requirements</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete these requirements to maintain compliance with Romanian
              regulations
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceData.requirements.map(requirement => (
                <div
                  key={requirement.field}
                  className={`p-4 rounded-lg border ${getStatusColor(requirement.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(requirement.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{requirement.label}</h4>
                          {requirement.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {requirement.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          requirement.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {requirement.status === "completed"
                          ? "Completed"
                          : "Pending"}
                      </Badge>

                      {/* Action buttons for boolean fields */}
                      {["anpcApproval", "iscApproval"].includes(
                        requirement.field
                      ) && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={
                              complianceData.details[
                                requirement.field as keyof typeof complianceData.details
                              ]
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              updateComplianceStatus(requirement.field, true)
                            }
                            disabled={updating}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              !complianceData.details[
                                requirement.field as keyof typeof complianceData.details
                              ]
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              updateComplianceStatus(requirement.field, false)
                            }
                            disabled={updating}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Download className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-medium">Download Compliance Guide</div>
                  <div className="text-sm text-muted-foreground">
                    Get detailed instructions for Romanian compliance
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Upload className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-medium">Upload Documents</div>
                  <div className="text-sm text-muted-foreground">
                    Upload compliance certificates and documents
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <FileText className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-medium">Generate Compliance Report</div>
                  <div className="text-sm text-muted-foreground">
                    Create a detailed compliance report
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <TrendingUp className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-medium">View Compliance History</div>
                  <div className="text-sm text-muted-foreground">
                    Track your compliance progress over time
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Tips */}
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="text-green-900">Compliance Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">ANPC Approval</h4>
                  <p className="text-sm text-green-700">
                    Ensure your products meet consumer protection standards and
                    have proper safety certifications.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">ISC Approval</h4>
                  <p className="text-sm text-green-700">
                    Verify that your products comply with health and safety
                    regulations for educational materials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">
                    Business Registration
                  </h4>
                  <p className="text-sm text-green-700">
                    Keep your CUI, Nr. Reg. Com., and Cod Fiscal information up
                    to date for tax compliance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RomanianFeatures>
  );
}
