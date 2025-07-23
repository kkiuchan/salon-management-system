"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TreatmentWithImages } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Scissors,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TreatmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [treatment, setTreatment] = useState<TreatmentWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (params.treatmentId) {
      fetchTreatment();
    }
  }, [params.treatmentId]);

  const fetchTreatment = async () => {
    try {
      // 施術データを取得するため、顧客データを取得して該当する施術を見つける
      const customerResponse = await fetch(`/api/customers/${params.id}`);
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        const treatmentData = customerData.treatments?.find(
          (t: TreatmentWithImages) => t.id === params.treatmentId
        );
        if (treatmentData) {
          setTreatment(treatmentData);
        }
      }
    } catch (error) {
      console.error("施術データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイル形式チェック
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        alert("JPEG、PNG、WebPファイルのみアップロード可能です");
        return;
      }

      // ファイルサイズチェック（10MB）
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("ファイルサイズは10MB以下である必要があります");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(
        `/api/treatments/${params.treatmentId}/images`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const newImage = await response.json();
        setTreatment((prev) =>
          prev
            ? {
                ...prev,
                treatment_images: [...prev.treatment_images, newImage],
              }
            : null
        );
        setSelectedFile(null);
        // ファイル入力をリセット
        const fileInput = document.getElementById(
          "image-upload"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const error = await response.json();
        alert(`アップロードに失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("画像のアップロードに失敗しました:", error);
      alert("アップロードエラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("ja-JP");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!treatment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">施術が見つかりません</h2>
          <Button onClick={() => router.push(`/customers/${params.id}`)}>
            顧客詳細に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => router.push(`/customers/${params.id}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              顧客詳細に戻る
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">施術詳細</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 施術情報 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  {treatment.menu}
                </CardTitle>
                <CardDescription>
                  {formatDate(treatment.date)} の施術
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{formatDate(treatment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{treatment.stylist_name}</span>
                    </div>
                    {treatment.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{treatment.duration}分</span>
                      </div>
                    )}
                    {treatment.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>¥{treatment.price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {treatment.notes && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">備考</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {treatment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 画像アップロード */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  画像アップロード
                </CardTitle>
                <CardDescription>
                  施術の画像をアップロードできます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image-upload">画像ファイルを選択</Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      JPEG、PNG、WebP形式、最大10MBまで
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button onClick={handleUpload} disabled={uploading}>
                          {uploading ? "アップロード中..." : "アップロード"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* アップロード済み画像一覧 */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>
                アップロード済み画像 ({treatment.treatment_images.length}枚)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatment.treatment_images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {treatment.treatment_images.map((image) => (
                    <div key={image.id} className="group relative">
                      <div className="aspect-square relative overflow-hidden rounded-lg border bg-gray-100">
                        <Image
                          src={image.image_url}
                          alt="施術画像"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        {formatDateTime(image.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    画像がありません
                  </h3>
                  <p className="text-gray-500">
                    上記のフォームから画像をアップロードしてください
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
