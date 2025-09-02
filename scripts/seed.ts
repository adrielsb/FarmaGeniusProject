
import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  try {
    // Create admin user
    const hashedPassword = await hash("johndoe123", 12)
    
    const adminUser = await prisma.user.upsert({
      where: { email: "john@doe.com" },
      update: {},
      create: {
        name: "Administrator",
        email: "john@doe.com", 
        password: hashedPassword,
      }
    })

    console.log("✅ Admin user created:", adminUser.email)

    // Create a sample mapping
    const sampleMapping = await prisma.mapping.create({
      data: {
        userId: adminUser.id,
        name: "Mapeamento Padrão",
        description: "Mapeamento básico para fórmulas normalizadas",
        mappingData: {
          "formula_a": "Linha 1",
          "formula_b": "Linha 2",
          "formula_c": "Linha 3"
        },
        isDefault: true
      }
    })

    console.log("✅ Sample mapping created:", sampleMapping.name)

    // Create sample processing history
    await prisma.processingHistory.create({
      data: {
        action: "seed_database",
        details: "Database seeded with initial data",
        status: "success"
      }
    })

    console.log("✅ Database seeded successfully!")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
