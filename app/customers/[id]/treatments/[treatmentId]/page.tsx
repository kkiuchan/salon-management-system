"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TreatmentWithImages } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Save,
  Scissors,
  Trash2,
  Upload,
  User,
  X,
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
  const [submitting, setSubmitting] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 編集関連の状態
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    date: "",
    menu: "",
    stylist_name: "",
    price: 0,
    duration: 0,
    notes: "",
  });

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
          // 編集データを初期化
          setEditData({
            date: treatmentData.date || "",
            menu: treatmentData.menu || "",
            stylist_name: treatmentData.stylist_name || "",
            price: treatmentData.price || 0,
            duration: treatmentData.duration || 0,
            notes: treatmentData.notes || "",
          });
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

  const handleImageAdd = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 施術更新処理
  const handleUpdateTreatment = async () => {
    if (!treatment) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/treatments/${treatment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedTreatment = await response.json();
        setTreatment(updatedTreatment);
        setIsEditing(false);
        alert("施術情報を更新しました");
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("施術の更新に失敗しました:", error);
      alert("更新エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  // 施術削除処理
  const handleDeleteTreatment = async () => {
    if (!treatment) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/treatments/${treatment.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("施術を削除しました");
        router.push(`/customers/${params.id}`);
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("施術の削除に失敗しました:", error);
      alert("削除エラーが発生しました");
    } finally {
      setSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // 画像削除処理
  const handleDeleteImage = async (imageId: string) => {
    if (confirm("この画像を削除しますか？この操作は取り消せません。")) {
      setDeletingImageId(imageId);
      try {
        const response = await fetch(
          `/api/treatments/${params.treatmentId}/images/${imageId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setTreatment((prev) =>
            prev
              ? {
                  ...prev,
                  treatment_images: prev.treatment_images.filter(
                    (img) => img.id !== imageId
                  ),
                }
              : null
          );
        } else {
          const error = await response.json();
          alert(`削除に失敗しました: ${error.error}`);
        }
      } catch (error) {
        console.error("画像の削除に失敗しました:", error);
        alert("削除エラーが発生しました");
      } finally {
        setDeletingImageId(null);
      }
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
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center">
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

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleUpdateTreatment}
                    disabled={submitting}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      // 編集データをリセット
                      setEditData({
                        date: treatment.date || "",
                        menu: treatment.menu || "",
                        stylist_name: treatment.stylist_name || "",
                        price: treatment.price || 0,
                        duration: treatment.duration || 0,
                        notes: treatment.notes || "",
                      });
                    }}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    キャンセル
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                  <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        削除
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>施術の削除</DialogTitle>
                        <DialogDescription>
                          この施術を削除しますか？この操作は取り消せません。
                          関連する画像もすべて削除されます。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteTreatment}
                          disabled={submitting}
                        >
                          {submitting ? "削除中..." : "削除"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
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
                  {isEditing ? "施術情報を編集" : treatment.menu}
                </CardTitle>
                {!isEditing && (
                  <CardDescription>
                    {formatDate(treatment.date)} の施術
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  // 編集フォーム
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">施術日 *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={editData.date}
                          onChange={(e) =>
                            setEditData({ ...editData, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="menu">メニュー *</Label>
                        <Input
                          id="menu"
                          value={editData.menu}
                          onChange={(e) =>
                            setEditData({ ...editData, menu: e.target.value })
                          }
                          placeholder="例: カット + カラー"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="stylist_name">スタイリスト *</Label>
                        <Input
                          id="stylist_name"
                          value={editData.stylist_name}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              stylist_name: e.target.value,
                            })
                          }
                          placeholder="担当スタイリスト名"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">料金</Label>
                        <Input
                          id="price"
                          type="number"
                          value={editData.price}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              price: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">施術時間（分）</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={editData.duration}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              duration: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">備考</Label>
                      <Textarea
                        id="notes"
                        value={editData.notes}
                        onChange={(e) =>
                          setEditData({ ...editData, notes: e.target.value })
                        }
                        placeholder="施術に関する備考があれば記入してください"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  // 表示モード
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
                    {treatment.notes && (
                      <div className="md:col-span-2 mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {treatment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 画像アップロード - シンプル版 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  画像管理
                </CardTitle>
                <CardDescription>
                  施術の画像をアップロード・管理できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* ファイル入力（非表示） */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* シンプルなアップロードボタン */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleImageAdd}
                    className="w-full h-12 text-base"
                    disabled={uploading}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    画像を追加
                  </Button>

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
                      <div className="mt-2 space-y-2">
                        <div className="text-xs text-gray-500 text-center">
                          {formatDateTime(image.created_at)}
                        </div>
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={deletingImageId === image.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {deletingImageId === image.id
                              ? "削除中..."
                              : "削除"}
                          </Button>
                        </div>
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
