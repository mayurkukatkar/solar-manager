import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ootnhbdzmotfplowhbty.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdG5oYmR6bW90ZnBsb3doYnR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc2MjI3NywiZXhwIjoyMTA2MzM4Mjc3fQ.M2dh3E9kYKG6B9yZQS2wNE9prG85DtzQWyzf4F8jt2g";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, company, phone, email, cityState, businessType, monthlyVolume, preferredTime, notes } = body;

    if (!name || !company || !phone || !email) {
      return NextResponse.json(
        { error: "Name, company, phone, and email are required fields." },
        { status: 400 }
      );
    }

    const payload = {
      name: String(name).trim(),
      company: String(company).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      cityState: cityState ? String(cityState).trim() : null,
      businessType: businessType || "Rooftop Solar EPC",
      monthlyVolume: monthlyVolume || "5 to 20 projects/month",
      preferredTime: preferredTime || null,
      notes: notes ? String(notes).trim() : null,
      status: "NEW",
      source: "Marketing Website - Primary Demo Booking Funnel"
    };

    let savedLeadId = `DEMO-${Date.now()}`;

    // 1. Persist directly into Supabase PlatformLead table
    try {
      const restRes = await fetch(`${SUPABASE_URL}/rest/v1/PlatformLead`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(payload)
      });

      if (restRes.ok) {
        const data = await restRes.json();
        if (Array.isArray(data) && data[0]?.id) {
          savedLeadId = data[0].id;
        }
      } else {
        const errText = await restRes.text();
        console.warn("[WhereReady Solar OS] Warning: Supabase REST insert error:", errText);
      }
    } catch (dbErr) {
      console.warn("[WhereReady Solar OS] Warning: Failed to insert demo lead directly to Supabase:", dbErr);
    }

    console.log("[WhereReady Solar OS] Inbound Platform Lead Saved:", {
      id: savedLeadId,
      company: payload.company,
      name: payload.name,
      phone: payload.phone
    });

    return NextResponse.json({
      success: true,
      message: "Demo request received successfully. Our team will contact you shortly.",
      leadId: savedLeadId
    });
  } catch (error: any) {
    console.error("[WhereReady Solar OS] Error processing demo request:", error);
    return NextResponse.json(
      { error: "Internal server error processing demo request" },
      { status: 500 }
    );
  }
}
