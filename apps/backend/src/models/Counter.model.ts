import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

// Atomic sequence generator for order display ids / tokens. Using
// findByIdAndUpdate with $inc is a single atomic Mongo operation, so two
// concurrent checkouts can never be handed the same number (unlike the old
// localStorage demo, which derived the next id from `orders.length` and
// could race between tabs).
//
// Note: a schema `default` on `seq` would NOT apply here — Mongoose only
// backfills defaults for fields an upsert's update doesn't touch, and $inc
// touches `seq` directly, so a fresh counter starts the underlying document
// at 1 regardless. The +1000 offset is added by the caller instead of
// depending on that.
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number },
});

export const Counter = models.Counter ?? model("Counter", counterSchema);

const ORDER_NUMBER_OFFSET = 1000;

export async function nextOrderNumber(): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    "orderSequence",
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean<{ seq: number }>();
  return ORDER_NUMBER_OFFSET + doc!.seq;
}
