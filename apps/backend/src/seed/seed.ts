// Run with `npm run seed`. Idempotent: upserts vendors/products/offers by
// their slug id, and only creates demo vendor accounts if they don't exist.
import { connectDB } from "../config/db";
import { Vendor } from "../models/Vendor.model";
import { Product } from "../models/Product.model";
import { Offer } from "../models/Offer.model";
import { User } from "../models/User.model";
import { hashPassword } from "../utils/password.util";
import {
  seedVendors,
  seedProducts,
  seedOffers,
  seedVendorAccounts,
} from "./seed-data";

async function main() {
  await connectDB();

  for (const v of seedVendors) {
    const { id, ...rest } = v;
    await Vendor.findByIdAndUpdate(
      id,
      { _id: id, ...rest },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`Seeded ${seedVendors.length} vendors.`);

  for (const p of seedProducts) {
    const { id, ...rest } = p;
    await Product.findByIdAndUpdate(
      id,
      { _id: id, ...rest },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`Seeded ${seedProducts.length} products.`);

  for (const o of seedOffers) {
    const { id, ...rest } = o;
    await Offer.findByIdAndUpdate(
      id,
      { _id: id, ...rest },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`Seeded ${seedOffers.length} offers.`);

  for (const acc of seedVendorAccounts) {
    const existing = await User.findOne({ email: acc.email });
    if (existing) continue;
    await User.create({
      name: acc.name,
      email: acc.email,
      role: "vendor",
      vendorId: acc.vendorId,
      passwordHash: await hashPassword(acc.password),
      isVerified: true,
      isActive: true,
    });
  }
  console.log(
    `Ensured ${seedVendorAccounts.length} vendor demo accounts exist (password: vendor123).`,
  );

  console.log("\nDemo vendor logins:");
  for (const acc of seedVendorAccounts)
    console.log(`  ${acc.email} / ${acc.password}  (stall: ${acc.vendorId})`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
