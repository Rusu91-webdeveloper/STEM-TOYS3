import React from "react";
import { render, screen } from "@testing-library/react";
import ProductEducation from "@/features/products/components/ProductEducation";

describe("ProductEducation", () => {
  it("renders sections when Romanian fields exist", () => {
    const product: any = {
      romanianCompetencies: ["Competențe școlare"],
      romanianCurriculumAlignment: ["Programa RO"],
      romanianTeacherResources: ["Resurse profesori"],
      romanianParentGuides: ["Ghid părinți"],
      romanianSubjectAreas: ["Matematică"],
      romanianEducationalCertification: "Cert RO",
      romanianEducationalLevel: "PRIMAR",
      romanianMinistryApproval: true,
    };

    render(<ProductEducation product={product} />);
    expect(screen.getByText(/Education/i)).toBeInTheDocument();
    expect(screen.getByText(/Certification/i)).toBeInTheDocument();
    expect(screen.getByText(/Level/i)).toBeInTheDocument();
    expect(screen.getByText(/Ministry Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/Competențe școlare/i)).toBeInTheDocument();
  });
});
