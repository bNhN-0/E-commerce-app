const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");



  // --- CATEGORIES ---
  const categories = [];
  for (let i = 1; i <= 3; i++) {
    const category = await prisma.category.create({
      data: {
        name: `Category ${i}`,
        description: `Description for category ${i}`,
      },
    });
    categories.push(category);
  }

  // --- PRODUCTS ---
  const products = [];
  for (let i = 1; i <= 10; i++) {
    const product = await prisma.product.create({
      data: {
        name: `Product ${i}`,
        description: `Description for product ${i}`,
        price: Math.floor(Math.random() * 100) + 10,
        stock: Math.floor(Math.random() * 50) + 1,
        categoryId: categories[i % categories.length].id,
        imageUrl: `https://picsum.photos/200/200?random=${i}`,
      },
    });
    products.push(product);
  }

  // --- COUPONS ---
  const coupon = await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      discountPercent: 10,
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    },
  });

  console.log("Seeding finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
