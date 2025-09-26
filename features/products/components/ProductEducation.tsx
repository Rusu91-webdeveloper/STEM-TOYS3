"use client";

import React from "react";

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
    <div className="bg-white rounded-lg border p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Education</h3>

      {hasMeta && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {certification && (
            <div className="text-xs sm:text-sm">
              <div className="text-gray-600">Certification</div>
              <div className="text-gray-900">{certification}</div>
            </div>
          )}
          {level && (
            <div className="text-xs sm:text-sm">
              <div className="text-gray-600">Level</div>
              <div className="text-gray-900">{level}</div>
            </div>
          )}
          {typeof ministry === "boolean" && (
            <div className="text-xs sm:text-sm">
              <div className="text-gray-600">Ministry Approval</div>
              <div className="text-gray-900">{ministry ? "Yes" : "No"}</div>
            </div>
          )}
        </div>
      )}

      {blocks.map(block => {
        const items = Array.isArray(block.items) ? block.items : [];
        if (items.length === 0) return null;
        return (
          <div key={block.title} className="mb-3 last:mb-0">
            <div className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
              {block.title}
            </div>
            <ul className="list-disc list-inside space-y-0.5">
              {items.map((it: string, idx: number) => (
                <li
                  key={`${block.title}-${idx}`}
                  className="text-xs sm:text-sm text-gray-700"
                >
                  {it}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
