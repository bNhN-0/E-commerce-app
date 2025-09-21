import { PrismaClient, CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(" Seeding database...");

  // --- CATEGORIES ---
  const categories = [
    { type: CategoryType.FASHION, name: "Fashion", description: "Clothing, shoes, and accessories" },
    { type: CategoryType.ELECTRONICS, name: "Electronics", description: "Phones, laptops, gadgets, and appliances" },
    { type: CategoryType.HOME_LIVING, name: "Home & Living", description: "Furniture, kitchen, and home essentials" },
    { type: CategoryType.BEAUTY_HEALTH, name: "Beauty & Health", description: "Skincare, cosmetics, and wellness" },
    { type: CategoryType.SPORTS_OUTDOORS, name: "Sports & Outdoors", description: "Sportswear, gear, and outdoor items" },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }

  // --- PRODUCTS ---
  for (let i = 1; i <= 20; i++) {
    const randomCategory = createdCategories[Math.floor(Math.random() * createdCategories.length)];

    await prisma.product.create({
      data: {
        name: `Product ${i}`,
        description: `High quality ${randomCategory.name.toLowerCase()} item #${i}`,
        price: Math.floor(Math.random() * 100) + 10,
        stock: Math.floor(Math.random() * 50) + 1,
        categoryId: randomCategory.id,
        imageUrl: `https://picsum.photos/400/400?random=${i}`,
      },
    });
  }

  // --- COUPONS ---
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountPercent: 10,
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    },
  });

  console.log(" Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(" Seeding failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
