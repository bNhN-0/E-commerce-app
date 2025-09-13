import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const electronics = await prisma.category.create({ data: { name: "Electronics" } });
  const fashion = await prisma.category.create({ data: { name: "Fashion" } });

  await prisma.product.createMany({
    data: [
      {
        name: "Wireless Headphones",
        description: "Noise-canceling headphones",
        price: 59.99,
        stock: 25,
        image: "/assets/products/headphones.jpg",
        categoryId: electronics.id,
      },
      {
        name: "Running Shoes",
        description: "Lightweight running shoes",
        price: 89.99,
        stock: 12,
        image: "/assets/products/shoes.jpg",
        categoryId: fashion.id,
      },
    ],
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
