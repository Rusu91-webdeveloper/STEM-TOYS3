"use client";

import React from "react";

import {
  productBodyTextClass,
  productMutedTextClass,
  productSubSectionCardClass,
  productTitleClass,
} from "./productTheme";

type ProductEducationProps = {
  product: any;
};

export default function ProductEducation({ product }: ProductEducationProps) {
  const blocks: Array<{ title: string; items: string[] | undefined }> = [
    { title: "Romanian Competencies", items: product.romanianCompetencies },
    {
      title: "Curriculum Alignment",
      items: product.romanianCurriculumAlignment,
    },
    { title: "Teacher Resources", items: product.romanianTeacherResources },
    { title: "Parent Guides", items: product.romanianParentGuides },
    { title: "Subject Areas", items: product.romanianSubjectAreas },
  ];

  const certification = product.romanianEducationalCertification;
  const level = product.romanianEducationalLevel;
  const ministry = product.romanianMinistryApproval;

  const hasLists = blocks.some(b => Array.isArray(b.items) && b.items.length);
  const hasMeta = certification || level || ministry;

  if (!hasLists && !hasMeta) return null;

  return (
    <div className={`${productSubSectionCardClass} space-y-4`}>
      <h3 className={productTitleClass}>Education</h3>

      {hasMeta && (
        <div className="grid gap-3 sm:grid-cols-3">
          {certification && (
            <div className="space-y-1">
              <div className={`${productMutedTextClass} text-xs`}>
                Certification
              </div>
              <div className={productBodyTextClass}>{certification}</div>
            </div>
          )}
          {level && (
            <div className="space-y-1">
              <div className={`${productMutedTextClass} text-xs`}>Level</div>
              <div className={productBodyTextClass}>{level}</div>
            </div>
          )}
          {typeof ministry === "boolean" && (
            <div className="space-y-1">
              <div className={`${productMutedTextClass} text-xs`}>
                Ministry Approval
              </div>
              <div className={productBodyTextClass}>
                {ministry ? "Yes" : "No"}
              </div>
            </div>
          )}
        </div>
      )}

      {blocks.map(block => {
        const items = Array.isArray(block.items) ? block.items : [];
        if (items.length === 0) return null;
        return (
          <div key={block.title} className="space-y-1">
            <div className="text-sm font-medium text-slate-100">
              {block.title}
            </div>
            <ul className="space-y-1.5">
              {items.map((it: string, idx: number) => (
                <li
                  key={`${block.title}-${idx}`}
                  className={`flex items-start gap-3 ${productBodyTextClass}`}
                >
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                  <span className="flex-1">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
