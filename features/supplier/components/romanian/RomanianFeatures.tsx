"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isRomanianSupplier } from "@/types/romanian";

interface RomanianFeaturesProps {
  supplier: {
    businessCountry: string;
  };
  children: ReactNode;
  showBadge?: boolean;
}

export function RomanianFeatures({ supplier, children, showBadge = true }: RomanianFeaturesProps) {
  const isRomanian = isRomanianSupplier(supplier.businessCountry);

  if (!isRomanian) {
    return null;
  }

  return (
    <div className="romanian-features space-y-4">
      {showBadge && (
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            🇷🇴 Romanian Market Features
          </Badge>
          <span className="text-sm text-muted-foreground">
            Specialized features for Romanian suppliers
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

interface RomanianFeatureCardProps {
  supplier: {
    businessCountry: string;
  };
  title: string;
  description: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function RomanianFeatureCard({ 
  supplier, 
  title, 
  description, 
  children, 
  icon 
}: RomanianFeatureCardProps) {
  const isRomanian = isRomanianSupplier(supplier.businessCountry);

  if (!isRomanian) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon && <div className="text-blue-600">{icon}</div>}
          <CardTitle className="text-lg text-blue-900">{title}</CardTitle>
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            🇷🇴 Romania
          </Badge>
        </div>
        <p className="text-sm text-blue-700">{description}</p>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface RomanianComplianceStatusProps {
  supplier: {
    businessCountry: string;
    romanianComplianceStatus?: string;
    anpcApproval?: boolean;
    iscApproval?: boolean;
    educationalCertification?: string;
  };
}

export function RomanianComplianceStatus({ supplier }: RomanianComplianceStatusProps) {
  const isRomanian = isRomanianSupplier(supplier.businessCountry);

  if (!isRomanian) {
    return null;
  }

  return (
    <RomanianFeatureCard
      supplier={supplier}
      title="Romanian Compliance Status"
      description="Track your compliance with Romanian regulations"
      icon="🏛️"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium">ANPC Approval</span>
            <Badge variant={supplier.anpcApproval ? "default" : "secondary"}>
              {supplier.anpcApproval ? "✅ Approved" : "⏳ Pending"}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium">ISC Approval</span>
            <Badge variant={supplier.iscApproval ? "default" : "secondary"}>
              {supplier.iscApproval ? "✅ Approved" : "⏳ Pending"}
            </Badge>
          </div>
        </div>
        
        {supplier.romanianComplianceStatus && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium">Overall Compliance</span>
            <Badge variant="outline" className="capitalize">
              {supplier.romanianComplianceStatus.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>
        )}
        
        {supplier.educationalCertification && (
          <div className="p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium block mb-1">Educational Certification</span>
            <span className="text-sm text-muted-foreground">
              {supplier.educationalCertification}
            </span>
          </div>
        )}
      </div>
    </RomanianFeatureCard>
  );
}

interface RomanianEducationalStandardsProps {
  supplier: {
    businessCountry: string;
  };
  product?: {
    romanianEducationalLevel?: string;
    romanianMinistryApproval?: boolean;
    romanianCurriculumAlignment?: string[];
  };
}

export function RomanianEducationalStandards({ supplier, product }: RomanianEducationalStandardsProps) {
  const isRomanian = isRomanianSupplier(supplier.businessCountry);

  if (!isRomanian) {
    return null;
  }

  return (
    <RomanianFeatureCard
      supplier={supplier}
      title="Romanian Educational Standards"
      description="Align your products with Romanian curriculum standards"
      icon="📚"
    >
      <div className="space-y-3">
        {product?.romanianEducationalLevel && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium">Educational Level</span>
            <Badge variant="outline" className="capitalize">
              {product.romanianEducationalLevel.toLowerCase()}
            </Badge>
          </div>
        )}
        
        {product?.romanianMinistryApproval !== undefined && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium">Ministry Approval</span>
            <Badge variant={product.romanianMinistryApproval ? "default" : "secondary"}>
              {product.romanianMinistryApproval ? "✅ Approved" : "⏳ Pending"}
            </Badge>
          </div>
        )}
        
        {product?.romanianCurriculumAlignment && product.romanianCurriculumAlignment.length > 0 && (
          <div className="p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium block mb-2">Curriculum Alignment</span>
            <div className="flex flex-wrap gap-1">
              {product.romanianCurriculumAlignment.map((alignment, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {alignment}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </RomanianFeatureCard>
  );
}

interface RomanianPaymentInfoProps {
  supplier: {
    businessCountry: string;
    romanianBankAccount?: string;
    romanianPaymentTerms?: number;
    romanianCurrency?: string;
  };
}

export function RomanianPaymentInfo({ supplier }: RomanianPaymentInfoProps) {
  const isRomanian = isRomanianSupplier(supplier.businessCountry);

  if (!isRomanian) {
    return null;
  }

  return (
    <RomanianFeatureCard
      supplier={supplier}
      title="Romanian Payment Information"
      description="Manage your Romanian payment and banking details"
      icon="💳"
    >
      <div className="space-y-3">
        {supplier.romanianBankAccount && (
          <div className="p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium block mb-1">Bank Account</span>
            <span className="text-sm text-muted-foreground font-mono">
              {supplier.romanianBankAccount}
            </span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium">Payment Terms</span>
            <Badge variant="outline">
              Net {supplier.romanianPaymentTerms || 30} days
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium">Currency</span>
            <Badge variant="outline">
              {supplier.romanianCurrency || "RON"}
            </Badge>
          </div>
        </div>
      </div>
    </RomanianFeatureCard>
  );
}
