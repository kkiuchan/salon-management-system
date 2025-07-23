import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const customerUpdateSchema = z.object({
  name: z.string().min(1, "名前は必須です").optional(),
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

// GET /api/customers/[id] - 顧客詳細取得
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

    const { data: customer, error } = await supabase
      .from("customers")
      .select(
        `
        *,
        treatments (
          *,
          treatment_images (*)
        )
      `
      )
      .eq("id", customerId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "顧客が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - 顧客更新
export async function PUT(
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
    const validatedData = customerUpdateSchema.parse(body);

    const { data: customer, error } = await supabase
      .from("customers")
      .update(validatedData)
      .eq("id", customerId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "顧客が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(customer);
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

// DELETE /api/customers/[id] - 顧客削除
export async function DELETE(
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

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "顧客を削除しました" });
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
