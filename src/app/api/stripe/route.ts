import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

const settingsUrl = process.env.NEXTAUTH_URL + "/settings";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new NextResponse("unauthorised", { status: 401 });
    }

    const userSubscription = await prisma.userSubscription.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    // cancel subscription (user if already subscribed)
    if (userSubscription && userSubscription.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stripeCustomerId,
        return_url: settingsUrl,
      });
      return NextResponse.json({ url: stripeSession.url });
    }

    // user's first time subscribing (no subscription yet)
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: settingsUrl,
      cancel_url: settingsUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: session.user.email ?? "",
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "IntelliCourse Pro",
              description: "unlimited course generated!",
            },
            unit_amount: 2000,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      // metadata for processing stripe webhook
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.log("STRIPE_ERROR", error);
    return new NextResponse("internal server error", { status: 500 });
  }
}
