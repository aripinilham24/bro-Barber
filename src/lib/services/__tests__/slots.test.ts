import { describe, expect, it } from "vitest";
import { generateSlotTimes } from "@/lib/services/slots";

describe("generateSlotTimes", () => {
  it("menghasilkan slot dari jam buka sampai tutup", () => {
    const slots = generateSlotTimes("10:00", "12:00", 30, 0);
    expect(slots).toEqual([
      { start: "10:00", end: "10:30" },
      { start: "10:30", end: "11:00" },
      { start: "11:00", end: "11:30" },
      { start: "11:30", end: "12:00" },
    ]);
  });

  it("menghormati jeda antar slot", () => {
    const slots = generateSlotTimes("10:00", "11:00", 20, 10);
    expect(slots).toEqual([
      { start: "10:00", end: "10:20" },
      { start: "10:30", end: "10:50" },
    ]);
  });

  it("tidak membuat slot yang melebihi jam tutup", () => {
    const slots = generateSlotTimes("10:00", "10:40", 30, 0);
    expect(slots).toEqual([{ start: "10:00", end: "10:30" }]);
  });

  it("menangani format dengan nol di depan", () => {
    const slots = generateSlotTimes("09:05", "09:45", 20, 0);
    expect(slots[0]).toEqual({ start: "09:05", end: "09:25" });
  });

  it("kembali kosong bila durasi lebih panjang dari jam buka", () => {
    expect(generateSlotTimes("10:00", "10:15", 30, 0)).toEqual([]);
  });
});
