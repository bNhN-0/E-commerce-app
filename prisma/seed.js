const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // --- USERS ---
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: "password123",
      },
    });
    users.push(user);
  }

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

  // --- CARTS ---
  const carts = [];
  for (const user of users) {
    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
      },
    });
    carts.push(cart);
  }

  // --- CART ITEMS ---
  for (const cart of carts) {
    const product = products[Math.floor(Math.random() * products.length)];
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: Math.floor(Math.random() * 3) + 1,
      },
    });
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
