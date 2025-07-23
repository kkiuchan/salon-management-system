import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const treatmentSchema = z.object({
  date: z.string().min(1, "施術日は必須です"),
  menu: z.string().min(1, "メニューは必須です"),
  stylist_name: z.string().min(1, "スタイリスト名は必須です"),
  price: z.number().min(0, "料金は0以上である必要があります").optional(),
  duration: z.number().min(0, "施術時間は0以上である必要があります").optional(),
  notes: z.string().optional(),
});

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component can't set cookies
          }
        },
      },
    }
  );
}

// GET /api/customers/[id]/treatments - 顧客の施術履歴一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const customerId = resolvedParams.id;

    const supabase = await createSupabaseClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data: treatments, error } = await supabase
      .from("treatments")
      .select(
        `
        *,
        treatment_images (*)
      `
      )
      .eq("customer_id", customerId)
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(treatments);
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// POST /api/customers/[id]/treatments - 施術履歴作成
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const customerId = resolvedParams.id;

    const supabase = await createSupabaseClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = treatmentSchema.parse(body);

    // 顧客の存在確認
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "顧客が見つかりません" },
        { status: 404 }
      );
    }

    const { data: treatment, error } = await supabase
      .from("treatments")
      .insert([
        {
          ...validatedData,
          customer_id: customerId,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
