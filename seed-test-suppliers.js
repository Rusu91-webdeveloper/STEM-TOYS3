const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedTestSuppliers() {
  try {
    console.log("Creating test suppliers...");

    const testSuppliers = [
      {
        name: "TechToys Romania SRL",
        companyName: "TechToys Romania SRL",
        email: "contact@techtots.ro",
        phone: "+40 721 123 456",
        contactPerson: "Ion Popescu",
        contactPersonName: "Ion Popescu",
        contactPersonEmail: "ion@techtots.ro",
        contactPersonPhone: "+40 721 123 456",
        businessAddress: "Strada Victoriei 10",
        businessCity: "Bucharest",
        businessState: "Bucharest",
        businessCountry: "Romania",
        businessPostalCode: "010101",
        vatNumber: "RO12345678",
        cui: "12345678",
        nrRegCom: "J40/1234/2020",
        reprezentantLegal: "Ion Popescu",
        description: "Leading STEM toy manufacturer in Romania",
        website: "https://techtots.ro",
        productCategories: ["Robotics", "Coding", "Science Kits"],
        certifications: ["ISO 9001", "Educational Certification"],
        status: "APPROVED",
        commissionRate: 15.0,
        paymentTerms: 30,
        minimumOrderValue: 500.0,
        anpcApproval: true,
        iscApproval: true,
        romanianComplianceStatus: "APPROVED",
        yearEstablished: 2020,
        employeeCount: 25,
        annualRevenue: "500000-1000000",
      },
      {
        name: "EduGames Bulgaria EOOD",
        companyName: "EduGames Bulgaria EOOD",
        email: "info@edugames.bg",
        phone: "+359 2 123 4567",
        contactPerson: "Maria Ivanova",
        contactPersonName: "Maria Ivanova",
        contactPersonEmail: "maria@edugames.bg",
        contactPersonPhone: "+359 2 123 4567",
        businessAddress: "ul. Vitosha 25",
        businessCity: "Sofia",
        businessState: "Sofia",
        businessCountry: "Bulgaria",
        businessPostalCode: "1000",
        vatNumber: "BG123456789",
        description: "Educational games and STEM learning tools",
        website: "https://edugames.bg",
        productCategories: ["Board Games", "STEM Kits", "Educational Software"],
        certifications: ["CE Mark", "Educational Standards"],
        status: "PENDING",
        commissionRate: 12.0,
        paymentTerms: 45,
        minimumOrderValue: 300.0,
        anpcApproval: false,
        iscApproval: false,
        romanianComplianceStatus: "PENDING",
        yearEstablished: 2018,
        employeeCount: 15,
        annualRevenue: "200000-500000",
      },
      {
        name: "InnoTech Hungary Kft",
        companyName: "InnoTech Hungary Kft",
        email: "sales@innotech.hu",
        phone: "+36 1 234 5678",
        contactPerson: "László Kovács",
        contactPersonName: "László Kovács",
        contactPersonEmail: "laszlo@innotech.hu",
        contactPersonPhone: "+36 1 234 5678",
        businessAddress: "Váci út 30",
        businessCity: "Budapest",
        businessState: "Budapest",
        businessCountry: "Hungary",
        businessPostalCode: "1062",
        vatNumber: "HU12345678",
        description: "Innovative technology solutions for education",
        website: "https://innotech.hu",
        productCategories: ["Electronics", "Programming", "3D Printing"],
        certifications: ["TÜV", "ISO 14001"],
        status: "APPROVED",
        commissionRate: 18.0,
        paymentTerms: 21,
        minimumOrderValue: 1000.0,
        anpcApproval: true,
        iscApproval: true,
        romanianComplianceStatus: "APPROVED",
        yearEstablished: 2015,
        employeeCount: 40,
        annualRevenue: "1000000-5000000",
      },
    ];

    for (const supplierData of testSuppliers) {
      const supplier = await prisma.supplier.create({
        data: supplierData,
      });
      console.log(`Created supplier: ${supplier.companyName}`);
    }

    console.log("Test suppliers created successfully!");
  } catch (error) {
    console.error("Error seeding suppliers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestSuppliers();
