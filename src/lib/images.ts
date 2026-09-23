import hero from "@/assets/hero-foodcourt.jpg";
import vendorTeaPoint from "@/assets/vendor-tea-point.jpg";
import vendorSnackShack from "@/assets/vendor-snack-shack.jpg";
import vendorGreenBowl from "@/assets/vendor-green-bowl.jpg";
import vendorTandoorHouse from "@/assets/vendor-tandoor-house.jpg";
import vendorRollExpress from "@/assets/vendor-roll-express.jpg";
import vendorSweetCorner from "@/assets/vendor-sweet-corner.jpg";
import masalaTea from "@/assets/masala-tea.jpg";
import filterCoffee from "@/assets/filter-coffee.jpg";
import butterBun from "@/assets/butter-bun.jpg";
import vegBurger from "@/assets/veg-burger.jpg";
import chickenBurger from "@/assets/chicken-burger.jpg";
import saltedFries from "@/assets/salted-fries.jpg";
import caesarSalad from "@/assets/caesar-salad.jpg";
import paneerWrap from "@/assets/paneer-wrap.jpg";
import fruitBowl from "@/assets/fruit-bowl.jpg";
import butterPaneer from "@/assets/butter-paneer.jpg";
import tandooriRoti from "@/assets/tandoori-roti.jpg";
import chickenBiryani from "@/assets/chicken-biryani.jpg";
import vegMomos from "@/assets/veg-momos.jpg";
import eggRoll from "@/assets/egg-roll.jpg";
import schezwanNoodles from "@/assets/schezwan-noodles.jpg";
import chocolateShake from "@/assets/chocolate-shake.jpg";
import redVelvetSlice from "@/assets/red-velvet-slice.jpg";

export const heroImage = hero;

export const vendorImages: Record<string, string> = {
  "tea-point": vendorTeaPoint,
  "snack-shack": vendorSnackShack,
  "green-bowl": vendorGreenBowl,
  "tandoor-house": vendorTandoorHouse,
  "roll-express": vendorRollExpress,
  "sweet-corner": vendorSweetCorner,
};

export const productImages: Record<string, string> = {
  p1: masalaTea,
  p2: filterCoffee,
  p3: butterBun,
  p4: vegBurger,
  p5: chickenBurger,
  p6: saltedFries,
  p7: caesarSalad,
  p8: paneerWrap,
  p9: fruitBowl,
  p10: butterPaneer,
  p11: tandooriRoti,
  p12: chickenBiryani,
  p13: vegMomos,
  p14: eggRoll,
  p15: schezwanNoodles,
  p16: chocolateShake,
  // p17 (Gulab Jamun) has no asset file in src/assets — falls back to the
  // default product image below until one is added.
  p18: redVelvetSlice,
};

export const productImage = (id: string) => productImages[id] ?? masalaTea;
export const vendorImage = (id: string) => vendorImages[id] ?? vendorTeaPoint;
