import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, company, phone, email, cityState, businessType, monthlyVolume, notes } = body;

    if (!name || !company || !phone || !email) {
      return NextResponse.json(
        { error: "Name, company, phone, and email are required fields." },
        { status: 400 }
      );
    }

    // Lead metadata recorded for conversion tracking
    const demoLead = {
      id: `DEMO-${Date.now()}`,
      name: name.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      cityState: cityState ? cityState.trim() : "",
      businessType: businessType || "Rooftop Solar EPC",
      monthlyVolume: monthlyVolume || "5 to 20 projects/month",
      notes: notes || "",
      source: "Marketing Website - Primary Demo Booking Funnel",
      createdAt: new Date().toISOString()
    };

    console.log("[WhereReady Solar OS] New Qualified Demo Request Received:", demoLead);

    return NextResponse.json({
      success: true,
      message: "Demo request received successfully. Our team will contact you shortly.",
      leadId: demoLead.id
    });
  } catch (error: any) {
    console.error("[WhereReady Solar OS] Error processing demo request:", error);
    return NextResponse.json(
      { error: "Internal server error processing demo request" },
      { status: 500 }
    );
  }
}
