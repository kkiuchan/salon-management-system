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

// CSV用のエスケープ関数
function escapeCSV(text: string | null): string {
  if (!text) return "";
  // ダブルクォートをエスケープし、カンマや改行が含まれる場合はクォートで囲む
  const escaped = text.replace(/"/g, '""');
  if (
    escaped.includes(",") ||
    escaped.includes("\n") ||
    escaped.includes("\r") ||
    escaped.includes('"')
  ) {
    return `"${escaped}"`;
  }
  return escaped;
}

// GET /api/export/customers - 全顧客データのCSVエクスポート
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

    // URLパラメータから形式を取得
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const customerId = searchParams.get("customer_id");

    // データ取得クエリを構築
    let query = supabase
      .from("customers")
      .select(
        `
        id,
        name,
        gender,
        date_of_birth,
        phone,
        email,
        notes,
        created_at,
        updated_at,
        treatments (
          id,
          date,
          menu,
          stylist_name,
          price,
          duration,
          notes,
          created_at,
          treatment_images (
            id,
            image_url,
            created_at
          )
        )
      `
      )
      .order("created_at", { ascending: true });

    // 個別顧客指定の場合
    if (customerId) {
      query = query.eq("id", customerId);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error("顧客データ取得エラー:", error);
      return NextResponse.json(
        { error: "データの取得に失敗しました" },
        { status: 500 }
      );
    }

    if (format === "json") {
      // JSON形式でダウンロード
      const filename = customerId
        ? `customer_${customerId}_data.json`
        : `all_customers_data.json`;

      return new NextResponse(JSON.stringify(customers, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // CSV形式でダウンロード
    const csvData = [];

    // ヘッダー行
    csvData.push(
      [
        "顧客ID",
        "名前",
        "性別",
        "生年月日",
        "電話番号",
        "メールアドレス",
        "顧客備考",
        "顧客登録日",
        "顧客更新日",
        "施術ID",
        "施術日",
        "施術内容",
        "スタイリスト名",
        "料金",
        "施術時間",
        "施術備考",
        "施術登録日",
        "施術画像URL",
      ]
        .map(escapeCSV)
        .join(",")
    );

    // データ行
    customers.forEach((customer) => {
      if (!customer.treatments || customer.treatments.length === 0) {
        // 施術履歴がない顧客も出力
        csvData.push(
          [
            customer.id,
            customer.name,
            customer.gender || "",
            customer.date_of_birth || "",
            customer.phone || "",
            customer.email || "",
            customer.notes || "",
            customer.created_at
              ? new Date(customer.created_at).toLocaleString("ja-JP")
              : "",
            customer.updated_at
              ? new Date(customer.updated_at).toLocaleString("ja-JP")
              : "",
            "", // 施術ID
            "", // 施術日
            "", // 施術内容
            "", // スタイリスト名
            "", // 料金
            "", // 施術時間
            "", // 施術備考
            "", // 施術登録日
            "", // 施術画像URL
          ]
            .map(String)
            .map(escapeCSV)
            .join(",")
        );
      } else {
        customer.treatments.forEach((treatment) => {
          const imageUrls = treatment.treatment_images
            ? treatment.treatment_images.map((img) => img.image_url).join("; ")
            : "";

          csvData.push(
            [
              customer.id,
              customer.name,
              customer.gender || "",
              customer.date_of_birth || "",
              customer.phone || "",
              customer.email || "",
              customer.notes || "",
              customer.created_at
                ? new Date(customer.created_at).toLocaleString("ja-JP")
                : "",
              customer.updated_at
                ? new Date(customer.updated_at).toLocaleString("ja-JP")
                : "",
              treatment.id,
              treatment.date
                ? new Date(treatment.date).toLocaleDateString("ja-JP")
                : "",
              treatment.menu || "",
              treatment.stylist_name || "",
              treatment.price ? treatment.price.toString() : "",
              treatment.duration ? treatment.duration.toString() : "",
              treatment.notes || "",
              treatment.created_at
                ? new Date(treatment.created_at).toLocaleString("ja-JP")
                : "",
              imageUrls,
            ]
              .map(String)
              .map(escapeCSV)
              .join(",")
          );
        });
      }
    });

    const csvContent = csvData.join("\n");
    const filename = customerId
      ? `customer_${customerId}_data.csv`
      : `all_customers_data.csv`;

    // BOMを追加してExcelで文字化けを防ぐ
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("エクスポートエラー:", error);
    return NextResponse.json(
      { error: "エクスポートに失敗しました" },
      { status: 500 }
    );
  }
}
