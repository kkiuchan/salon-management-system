import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

// POST /api/admins/migrate - 現在のユーザーを管理者として登録
export async function POST() {
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

    // 既に管理者として登録されているかチェック
    const { data: existingAdmin, error: checkError } = await supabase
      .from("admins")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { message: "既に管理者として登録されています", admin: existingAdmin },
        { status: 200 }
      );
    }

    // 管理者が一人もいない場合は、このユーザーをスーパー管理者として登録
    const { data: adminCount } = await supabase
      .from("admins")
      .select("id", { count: "exact" });

    const role = (adminCount?.length || 0) === 0 ? "super_admin" : "admin";

    // 現在のユーザーを管理者として登録
    const { data: newAdmin, error: insertError } = await supabase
      .from("admins")
      .insert({
        auth_user_id: user.id,
        email: user.email!,
        name: user.email!.split("@")[0], // メールアドレスの@前を名前として使用
        role: role,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("管理者登録エラー:", insertError);
      return NextResponse.json(
        { error: `管理者の登録に失敗しました: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "管理者として登録しました",
        admin: newAdmin,
        isFirstAdmin: role === "super_admin",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("管理者移行エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
