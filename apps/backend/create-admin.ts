import { connectDB } from "./src/config/db.js";
import { User } from "./src/models/User.model.js";
import { hashPassword } from "./src/utils/password.util.js";
import mongoose from "mongoose";

async function createAdmin() {
  await connectDB();
  
  const email = "admin@easyfood.com";
  const password = "admin123";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin account already exists:", email);
  } else {
    await User.create({
      name: "EasyFood Admin",
      email: email,
      role: "admin",
      passwordHash: await hashPassword(password),
      isVerified: true,
      isActive: true,
    });
    console.log("Admin account created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  }
  
  await mongoose.disconnect();
}

createAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
