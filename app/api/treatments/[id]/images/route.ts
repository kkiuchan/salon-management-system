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

// POST /api/treatments/[id]/images - 施術画像アップロード
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const treatmentId = resolvedParams.id;
    console.log("処理開始 - 施術ID:", treatmentId);

    const supabase = await createSupabaseClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 施術の存在確認
    console.log("施術の存在確認:", treatmentId);
    const { data: treatment, error: treatmentError } = await supabase
      .from("treatments")
      .select("id")
      .eq("id", treatmentId)
      .single();

    if (treatmentError || !treatment) {
      return NextResponse.json(
        { error: "施術が見つかりません" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "画像ファイルが必要です" },
        { status: 400 }
      );
    }

    // ファイル形式チェック
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "JPEG、PNG、WebPファイルのみアップロード可能です",
        },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "ファイルサイズは10MB以下である必要があります",
        },
        { status: 400 }
      );
    }

    // ファイル名を生成
    const fileExt = file.name.split(".").pop();
    const fileName = `${treatmentId}/${Date.now()}.${fileExt}`;

    // Supabase Storageにアップロード
    console.log("ストレージアップロード開始:", fileName, file.type, file.size);

    // FileオブジェクトをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("treatment-images")
      .upload(fileName, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("ストレージアップロードエラー:", uploadError);
      return NextResponse.json(
        {
          error: `ストレージエラー: ${uploadError.message}`,
          details: uploadError,
        },
        { status: 500 }
      );
    }
    console.log("ストレージアップロード成功:", uploadData);

    // 公開URLを取得
    const {
      data: { publicUrl },
    } = supabase.storage.from("treatment-images").getPublicUrl(fileName);

    // データベースに画像情報を保存
    console.log("データベースに画像情報を保存:", {
      treatment_id: treatmentId,
      image_url: publicUrl,
    });
    const { data: treatmentImage, error: dbError } = await supabase
      .from("treatment_images")
      .insert([
        {
          treatment_id: treatmentId,
          image_url: publicUrl,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("データベース保存エラー:", dbError);
      // アップロードしたファイルを削除
      await supabase.storage.from("treatment-images").remove([fileName]);

      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    console.log("データベース保存成功:", treatmentImage);

    return NextResponse.json(treatmentImage, { status: 201 });
  } catch (error) {
    console.error("画像アップロードエラー:", error);
    return NextResponse.json(
      {
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
