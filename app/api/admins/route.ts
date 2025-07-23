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

// GET /api/admins - 管理者一覧取得
export async function GET() {
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

    // 現在のユーザーが管理者かチェック
    const { data: currentAdmin, error: adminCheckError } = await supabase
      .from("admins")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (adminCheckError || !currentAdmin) {
      return NextResponse.json(
        { error: "管理者権限がありません" },
        { status: 403 }
      );
    }

    // 管理者一覧を取得
    const { data: admins, error } = await supabase
      .from("admins")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// POST /api/admins - 新規管理者追加
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

    // 現在のユーザーが管理者かチェック
    const { data: currentAdmin, error: adminCheckError } = await supabase
      .from("admins")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (adminCheckError || !currentAdmin) {
      return NextResponse.json(
        { error: "管理者権限がありません" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name, role = "admin" } = body;

    // バリデーション
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "メールアドレス、パスワード、名前は必須です" },
        { status: 400 }
      );
    }

    // 管理者用のSupabaseクライアント（サービスロールキー使用）
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

    // 新しいユーザーを作成
    const { data: newAuthUser, error: signUpError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (signUpError) {
      return NextResponse.json(
        { error: `ユーザー作成に失敗しました: ${signUpError.message}` },
        { status: 400 }
      );
    }

    if (!newAuthUser.user) {
      return NextResponse.json(
        { error: "ユーザー作成に失敗しました" },
        { status: 500 }
      );
    }

    // 管理者テーブルに追加
    const { data: newAdmin, error: adminError } = await supabase
      .from("admins")
      .insert({
        auth_user_id: newAuthUser.user.id,
        email,
        name,
        role,
      })
      .select()
      .single();

    if (adminError) {
      // 管理者テーブルへの追加に失敗した場合、作成したユーザーを削除
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id);
      return NextResponse.json(
        { error: `管理者の追加に失敗しました: ${adminError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
