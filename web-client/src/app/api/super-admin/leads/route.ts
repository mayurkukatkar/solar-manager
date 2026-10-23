import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ootnhbdzmotfplowhbty.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdG5oYmR6bW90ZnBsb3doYnR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc2MjI3NywiZXhwIjoyMTA2MzM4Mjc3fQ.M2dh3E9kYKG6B9yZQS2wNE9prG85DtzQWyzf4F8jt2g";

export async function GET() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/PlatformLead?select=*&order=createdAt.desc`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      cache: "no-store"
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "Failed to fetch platform leads", details: errText }, { status: res.status });
    }

    const leads = await res.json();
    const list = Array.isArray(leads) ? leads : [];

    const total = list.length;
    const newCount = list.filter((l: any) => l.status === "NEW").length;
    const contactedCount = list.filter((l: any) => l.status === "CONTACTED").length;
    const scheduledCount = list.filter((l: any) => l.status === "DEMO_SCHEDULED").length;
    const convertedCount = list.filter((l: any) => l.status === "CONVERTED" || l.status === "TRIAL_PROVISIONED").length;

    return NextResponse.json({
      leads: list,
      metrics: {
        total,
        newCount,
        contactedCount,
        scheduledCount,
        convertedCount
      }
    });
  } catch (error: any) {
    console.error("[Super Admin] Error fetching platform leads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, notes, assignedTo } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/PlatformLead?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "Failed to update lead", details: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, lead: data[0] });
  } catch (error: any) {
    console.error("[Super Admin] Error updating lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/PlatformLead?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "Failed to delete lead", details: errText }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Super Admin] Error deleting lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
