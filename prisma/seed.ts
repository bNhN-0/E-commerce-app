import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = ["Electronics", "Fashion", "Home"];

  for (let name of categories) {
    await prisma.category.create({ data: { name } });
  }

  await prisma.product.createMany({
    data: [
      {
        name: "Wireless Headphones",
        description: "Noise-canceling headphones",
        price: 59.99,
        stock: 25,
        image: "/assets/products/headphones.jpg",
        category: "Electronics",
      },
      {
        name: "Running Shoes",
        description: "Lightweight running shoes",
        price: 89.99,
        stock: 12,
        image: "/assets/products/shoes.jpg",
        category: "Fashion",
      }
    ],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
