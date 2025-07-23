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

// DELETE /api/treatments/[id]/images/[imageId] - 画像削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: treatmentId, imageId } = resolvedParams;

    const supabase = await createSupabaseClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 画像情報を取得
    const { data: image, error: fetchError } = await supabase
      .from("treatment_images")
      .select("image_url")
      .eq("id", imageId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "画像が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Storage から画像ファイルを削除
    if (image.image_url) {
      try {
        const url = new URL(image.image_url);
        const fileName = url.pathname.split("/").pop();

        if (fileName) {
          await supabase.storage.from("treatment-images").remove([fileName]);
        }
      } catch (storageError) {
        console.error("ストレージからの削除エラー:", storageError);
        // ストレージの削除に失敗してもDBからは削除する
      }
    }

    // データベースから画像レコードを削除
    const { error: deleteError } = await supabase
      .from("treatment_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "画像が削除されました" });
  } catch (error) {
    console.error("画像の削除に失敗しました:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
