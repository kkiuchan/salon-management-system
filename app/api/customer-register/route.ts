import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

// POST /api/customer-register - 顧客による自己登録（認証不要）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gender, date_of_birth, phone, email, notes } = body;

    // バリデーション
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "お名前は必須です" }, { status: 400 });
    }

    // 管理者用のSupabaseクライアント（認証をバイパス）
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // noop
          },
        },
      }
    );

    // 顧客データを作成
    const { data: customer, error } = await supabaseAdmin
      .from("customers")
      .insert({
        name: name.trim(),
        gender: gender || null,
        date_of_birth: date_of_birth || null,
        phone: phone || null,
        email: email || null,
        notes: notes ? `【顧客入力】${notes}` : null, // 顧客入力であることを明記
      })
      .select()
      .single();

    if (error) {
      console.error("顧客登録エラー:", error);
      return NextResponse.json(
        { error: "登録に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "登録が完了しました",
        customer_id: customer.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("顧客登録API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
