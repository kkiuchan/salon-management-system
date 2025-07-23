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

// PUT /api/admins/[id] - 管理者情報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const adminId = resolvedParams.id;

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
    const { name, role, is_active } = body;

    // バリデーション
    if (!name) {
      return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
    }

    // 管理者情報を更新
    const { data: updatedAdmin, error } = await supabase
      .from("admins")
      .update({
        name,
        role: role || "admin",
        is_active: is_active !== undefined ? is_active : true,
      })
      .eq("id", adminId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "管理者が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/admins/[id] - 管理者削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const adminId = resolvedParams.id;

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

    // 削除対象の管理者情報を取得
    const { data: targetAdmin, error: fetchError } = await supabase
      .from("admins")
      .select("auth_user_id")
      .eq("id", adminId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "管理者が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // 自分自身を削除しようとしている場合はエラー
    if (currentAdmin.id === adminId) {
      return NextResponse.json(
        { error: "自分自身を削除することはできません" },
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

    // 管理者テーブルから削除（CASCADE により auth.users からも削除される）
    const { error: deleteError } = await supabase
      .from("admins")
      .delete()
      .eq("id", adminId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // auth.users からも削除
    await supabaseAdmin.auth.admin.deleteUser(targetAdmin.auth_user_id);

    return NextResponse.json({ message: "管理者が削除されました" });
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
