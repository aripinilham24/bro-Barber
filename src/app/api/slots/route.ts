import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { TimeSlotModel } from "@/lib/db/models";
import { sweepExpiredSlots, ensureSlotsForDate, ensureSlotsForRange } from "@/lib/services/slots";
import { addDays, todayISO } from "@/lib/utils";

/**
 * GET /api/slots
 *  - ?date=YYYY-MM-DD → daftar slot AVAILABLE untuk tanggal itu
 *  - tanpa param → ringkasan ketersediaan 14 hari ke depan
 */
export async function GET(request: NextRequest) {
  await connectDB();
  await sweepExpiredSlots();

  const date = new URL(request.url).searchParams.get("date");

  if (date) {
    await ensureSlotsForDate(date);
    const slots = await TimeSlotModel.find({ date, status: "AVAILABLE" })
      .select("date startTime endTime status")
      .sort({ startTime: 1 })
      .lean();
    return NextResponse.json(slots);
  }

  const todayStr = todayISO();
  await ensureSlotsForRange(todayStr, 14);

  const dates = Array.from({ length: 14 }, (_, i) => addDays(todayStr, i));
  const rows = await TimeSlotModel.aggregate<{
    date: string;
    available: number;
    times: string[];
  }>([
    { $match: { date: { $in: dates }, status: "AVAILABLE" } },
    { $sort: { date: 1, startTime: 1 } },
    {
      $group: {
        _id: "$date",
        times: { $push: "$startTime" },
      },
    },
    { $project: { _id: 0, date: "$_id", available: { $size: "$times" }, times: 1 } },
    { $sort: { date: 1 } },
  ]);

  return NextResponse.json(rows);
}
