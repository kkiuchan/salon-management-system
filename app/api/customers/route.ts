import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .optional()
    .or(z.literal("")),
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

// GET /api/customers - 顧客一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let query = supabase
      .from("customers")
      .select(
        `
        *,
        treatments (
          id,
          date,
          menu,
          stylist_name,
          price
        )
      `
      )
      .order("created_at", { ascending: false });

    // 名前検索
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // 来店日フィルター（施術履歴に基づく）
    if (dateFrom || dateTo) {
      // TODO: 来店日フィルターの実装
    }

    const { data: customers, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// POST /api/customers - 顧客作成
export async function POST(request: NextRequest) {
  try {
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
    const validatedData = customerSchema.parse(body);

    const { data: customer, error } = await supabase
      .from("customers")
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(customer, { status: 201 });
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
