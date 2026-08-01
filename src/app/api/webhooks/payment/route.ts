import { NextResponse, NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payment";
import { PaymentModel } from "@/lib/db/models";
import { ReservationModel } from "@/lib/db/models";
import { TimeSlotModel } from "@/lib/db/models";

export async function POST(request: NextRequest) {
  try {
    const provider = getPaymentProvider();
    const parsed = await provider.parseWebhook(request);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    const { externalId, event, provider: providerName, paidAt } = parsed;
    const payment = await PaymentModel.findOne({ externalId });

    if (!payment) {
      console.error(`Payment not found: ${externalId}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (event === "payment.paid") {
      if (payment.status === "PAID") {
        return NextResponse.json({ message: "Payment already processed" }, { status: 200 });
      }

      payment.status = "PAID";
      payment.paidAt = paidAt || new Date();
      await payment.save();

      // Update reservation status
      await ReservationModel.updateOne(
        { _id: payment.reservation },
        { $set: { status: "DP_PAID" } }
      );

      console.log(`Payment ${externalId} completed`);
      return NextResponse.json({ success: true }, { status: 200 });
    } else if (event === "payment.expired") {
      if (payment.status === "EXPIRED") {
        return NextResponse.json({ message: "Payment already expired" }, { status: 200 });
      }

      payment.status = "EXPIRED";
      await payment.save();

      // Return slot to AVAILABLE
      await TimeSlotModel.updateOne(
        { _id: payment.timeSlot },
        { $set: { status: "AVAILABLE", lockedUntil: null } }
      );

      // Update reservation status
      await ReservationModel.updateOne(
        { _id: payment.reservation },
        { $set: { status: "EXPIRED" } }
      );

      console.log(`Payment ${externalId} expired`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
