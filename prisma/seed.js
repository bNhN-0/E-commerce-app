const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Resetting tables...");
  await prisma.productMedia.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  console.log("🌱 Seeding database...");

  // ---------- Categories ----------
  const fashion = await prisma.category.create({
    data: { type: "FASHION", name: "Men's Fashion", description: "Clothing and accessories for men" },
  });

  const electronics = await prisma.category.create({
    data: { type: "ELECTRONICS", name: "Electronics", description: "Latest gadgets and consumer electronics" },
  });

  const homeLiving = await prisma.category.create({
    data: { type: "HOME_LIVING", name: "Home Living", description: "Furniture and home accessories" },
  });

  const beauty = await prisma.category.create({
    data: { type: "BEAUTY_HEALTH", name: "Beauty & Health", description: "Beauty and personal care products" },
  });

  const sports = await prisma.category.create({
    data: { type: "SPORTS_OUTDOORS", name: "Sports & Outdoors", description: "Sportswear and outdoor equipment" },
  });

  // ---------- Products ----------
  const products = [
    {
      name: "Classic White T-Shirt",
      description: "100% cotton slim fit white t-shirt",
      price: 19.99,
      stock: 100,
      categoryId: fashion.id,
      imageUrl: "https://picsum.photos/300/300?random=1",
      variants: [
        { sku: "TSHIRT-WHT-S-001", price: 19.99, stock: 30, attributes: { size: "S", color: "White" } },
        { sku: "TSHIRT-WHT-M-001", price: 19.99, stock: 40, attributes: { size: "M", color: "White" } },
      ],
    },
    {
      name: "Denim Jeans",
      description: "Regular fit blue denim jeans",
      price: 49.99,
      stock: 60,
      categoryId: fashion.id,
      imageUrl: "https://picsum.photos/300/300?random=2",
      variants: [
        { sku: "JEANS-32-001", price: 49.99, stock: 20, attributes: { waist: 32, length: 32 } },
        { sku: "JEANS-34-001", price: 49.99, stock: 20, attributes: { waist: 34, length: 34 } },
      ],
    },
    {
      name: "Running Shoes",
      description: "Lightweight breathable running shoes",
      price: 89.99,
      stock: 80,
      categoryId: sports.id,
      imageUrl: "https://picsum.photos/300/300?random=3",
      variants: [
        { sku: "RUNSHOE-9-001", price: 89.99, stock: 20, attributes: { size: 9, color: "Black" } },
        { sku: "RUNSHOE-10-001", price: 89.99, stock: 20, attributes: { size: 10, color: "White" } },
      ],
    },
    {
      name: "Smartphone X200",
      description: "5G smartphone with 128GB storage",
      price: 699.0,
      stock: 50,
      categoryId: electronics.id,
      imageUrl: "https://picsum.photos/300/300?random=4",
      variants: [
        { sku: "X200-BLK-128-001", price: 699, stock: 25, attributes: { color: "Black", storage: "128GB" } },
        { sku: "X200-BLU-256-001", price: 799, stock: 25, attributes: { color: "Blue", storage: "256GB" } },
      ],
    },
    {
      name: "Laptop Pro 15",
      description: "High-performance laptop with 16GB RAM",
      price: 1299.0,
      stock: 30,
      categoryId: electronics.id,
      imageUrl: "https://picsum.photos/300/300?random=5",
      variants: [
        { sku: "LTPRO-15-SIL-001", price: 1299, stock: 15, attributes: { color: "Silver", ram: "16GB" } },
        { sku: "LTPRO-15-BLK-001", price: 1399, stock: 15, attributes: { color: "Black", ram: "32GB" } },
      ],
    },
    {
      name: "Organic Face Cream",
      description: "Moisturizing cream with natural extracts",
      price: 24.99,
      stock: 200,
      categoryId: beauty.id,
      imageUrl: "https://picsum.photos/300/300?random=6",
      variants: [
        { sku: "FACECRM-50ML-001", price: 24.99, stock: 150, attributes: { size: "50ml" } },
        { sku: "FACECRM-100ML-001", price: 39.99, stock: 50, attributes: { size: "100ml" } },
      ],
    },
    {
      name: "Electric Toothbrush",
      description: "Rechargeable toothbrush with 3 modes",
      price: 59.99,
      stock: 120,
      categoryId: beauty.id,
      imageUrl: "https://picsum.photos/300/300?random=7",
      variants: [
        { sku: "ETOOTH-WHT-001", price: 59.99, stock: 60, attributes: { color: "White" } },
        { sku: "ETOOTH-BLU-001", price: 59.99, stock: 60, attributes: { color: "Blue" } },
      ],
    },
    {
      name: "Office Chair",
      description: "Ergonomic chair with adjustable height",
      price: 149.99,
      stock: 40,
      categoryId: homeLiving.id,
      imageUrl: "https://picsum.photos/300/300?random=8",
      variants: [
        { sku: "OFFCHAIR-BLK-001", price: 149.99, stock: 20, attributes: { color: "Black" } },
        { sku: "OFFCHAIR-GRY-001", price: 149.99, stock: 20, attributes: { color: "Gray" } },
      ],
    },
    {
      name: "Wooden Coffee Table",
      description: "Modern style wooden coffee table",
      price: 199.99,
      stock: 25,
      categoryId: homeLiving.id,
      imageUrl: "https://picsum.photos/300/300?random=9",
      variants: [
        { sku: "COFFEE-TBL-LG-001", price: 199.99, stock: 15, attributes: { size: "Large" } },
        { sku: "COFFEE-TBL-SM-001", price: 149.99, stock: 10, attributes: { size: "Small" } },
      ],
    },
    {
      name: "Camping Tent",
      description: "Waterproof 4-person camping tent",
      price: 249.99,
      stock: 15,
      categoryId: sports.id,
      imageUrl: "https://picsum.photos/300/300?random=10",
      variants: [
        { sku: "TENT-4P-GRN-001", price: 249.99, stock: 10, attributes: { capacity: 4, color: "Green" } },
        { sku: "TENT-2P-BLU-001", price: 179.99, stock: 5, attributes: { capacity: 2, color: "Blue" } },
      ],
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl,
        variants: { create: p.variants },
        media: { create: [{ url: p.imageUrl, type: "image" }] },
      },
    });
  }

  console.log("✅ Seed complete with 10 products!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
