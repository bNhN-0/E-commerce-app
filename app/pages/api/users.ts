import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }

    try {
      // Create user in Prisma DB
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: "", // empty because Supabase handles auth
        },
      });
      return res.status(201).json(user);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}
