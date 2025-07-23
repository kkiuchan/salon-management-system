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

// GET /api/treatments/[id] - 施術詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const treatmentId = resolvedParams.id;

    const supabase = await createSupabaseClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data: treatment, error } = await supabase
      .from("treatments")
      .select(
        `
        *,
        treatment_images (*)
      `
      )
      .eq("id", treatmentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "施術が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(treatment);
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// PUT /api/treatments/[id] - 施術更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const treatmentId = resolvedParams.id;

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
    const { date, menu, stylist_name, price, duration, notes } = body;

    // バリデーション
    if (!date || !menu || !stylist_name) {
      return NextResponse.json(
        { error: "日付、メニュー、スタイリスト名は必須です" },
        { status: 400 }
      );
    }

    const { data: treatment, error } = await supabase
      .from("treatments")
      .update({
        date,
        menu,
        stylist_name,
        price: price || null,
        duration: duration || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", treatmentId)
      .select(
        `
        *,
        treatment_images (*)
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(treatment);
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/treatments/[id] - 施術削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const treatmentId = resolvedParams.id;

    const supabase = await createSupabaseClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 関連する画像を先に削除
    const { data: images } = await supabase
      .from("treatment_images")
      .select("image_url")
      .eq("treatment_id", treatmentId);

    if (images && images.length > 0) {
      // Storage から画像ファイルを削除
      const filePaths = images
        .map((img) => {
          const url = new URL(img.image_url);
          return url.pathname.split("/").pop(); // ファイル名を取得
        })
        .filter((path): path is string => Boolean(path));

      if (filePaths.length > 0) {
        await supabase.storage.from("treatment-images").remove(filePaths);
      }
    }

    // 施術を削除（画像も CASCADE で削除される）
    const { error } = await supabase
      .from("treatments")
      .delete()
      .eq("id", treatmentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "施術が削除されました" });
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
