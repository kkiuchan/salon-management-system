"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TreatmentWithImages } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Scissors,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function TreatmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [treatment, setTreatment] = useState<TreatmentWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 画像を圧縮する関数
  const compressImage = (
    file: File,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8
  ): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // アスペクト比を保持しながらリサイズ
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 画像を描画
        ctx?.drawImage(img, 0, 0, width, height);

        // Blob に変換
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // ファイル形式チェック（より柔軟に）
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif", // iOS HEIC/HEIF 対応
      ];

      // ファイル拡張子からも判定
      const fileExtension = file.name.toLowerCase().split(".").pop();
      const allowedExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

      const isValidType =
        allowedTypes.includes(file.type) ||
        (fileExtension && allowedExtensions.includes(fileExtension));

      if (!isValidType) {
        alert(
          "JPEG、PNG、WebP、HEIC形式の画像ファイルをアップロードしてください"
        );
        return;
      }

      // 大きなファイルの場合は圧縮
      let processedFile = file;
      if (file.size > 5 * 1024 * 1024) {
        // 5MB以上の場合
        alert("画像を圧縮しています...");
        processedFile = await compressImage(file);
      }

      // 最終的なファイルサイズチェック（10MB）
      const maxSize = 10 * 1024 * 1024;
      if (processedFile.size > maxSize) {
        alert(
          "ファイルサイズが大きすぎます。別の画像を選択するか、画像を小さくしてください。"
        );
        return;
      }

      setSelectedFile(processedFile);

      // プレビュー画像を作成
      const url = URL.createObjectURL(processedFile);
      setPreviewUrl(url);
    } catch (error) {
      console.error("ファイル処理エラー:", error);
      alert("画像の処理中にエラーが発生しました");
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

        // 状態をリセット
        setSelectedFile(null);
        setPreviewUrl("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center h-14 sm:h-16">
            <Button
              variant="ghost"
              onClick={() => router.push(`/customers/${params.id}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              施術詳細
            </h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        <div className="space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>スタイリスト: {treatment.stylist_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>日付: {formatDate(treatment.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>料金: ¥{treatment.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>施術時間: {treatment.duration}分</span>
                  </div>
                </div>
                {treatment.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{treatment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 画像アップロード - iOS対応改善版 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  画像アップロード
                </CardTitle>
                <CardDescription>
                  施術の画像をアップロードできます（iOS/Android対応）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* ファイル入力（非表示） */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment" // iOS/Androidのカメラを優先
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* アップロードボタン（iOS対応） */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCameraCapture}
                      className="flex-1 h-12 text-base"
                      disabled={uploading}
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      写真を撮影
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute("capture");
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex-1 h-12 text-base"
                      disabled={uploading}
                    >
                      <ImageIcon className="h-5 w-5 mr-2" />
                      ギャラリーから選択
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    JPEG、PNG、WebP、HEIC形式対応 / 最大10MBまで
                    <br />
                    大きな画像は自動的に圧縮されます
                  </p>

                  {/* プレビューとアップロード */}
                  {selectedFile && (
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* プレビュー画像 */}
                        {previewUrl && (
                          <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <img
                              src={previewUrl}
                              alt="プレビュー"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* ファイル情報 */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        {/* アップロードボタン */}
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="flex-1 sm:flex-none"
                          >
                            {uploading ? "アップロード中..." : "アップロード"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl("");
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                            disabled={uploading}
                          >
                            キャンセル
                          </Button>
                        </div>
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
