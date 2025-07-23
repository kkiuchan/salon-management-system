"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CustomerWithTreatments } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Mail,
  Phone,
  Plus,
  Scissors,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerWithTreatments | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTreatmentDialogOpen, setIsTreatmentDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState({
    name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [newTreatment, setNewTreatment] = useState({
    date: "",
    menu: "",
    stylist_name: "",
    price: 0,
    duration: 0,
    notes: "",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
    }
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setEditCustomer({
          name: data.name || "",
          gender: data.gender || "",
          date_of_birth: data.date_of_birth || "",
          phone: data.phone || "",
          email: data.email || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      console.error("顧客データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editCustomer),
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomer((prev) => (prev ? { ...prev, ...updatedCustomer } : null));
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error("顧客の更新に失敗しました:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const processedFiles: Promise<File>[] = [];

    files.forEach(async (file) => {
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
          `${file.name}: JPEG、PNG、WebP、HEIC形式の画像ファイルをアップロードしてください`
        );
        return;
      }

      // 大きなファイルの場合は圧縮
      if (file.size > 5 * 1024 * 1024) {
        // 5MB以上の場合
        try {
          const compressedFile = await compressImage(file);

          const maxSize = 10 * 1024 * 1024;
          if (compressedFile.size > maxSize) {
            alert(
              `${file.name}: ファイルサイズが大きすぎます。別の画像を選択してください。`
            );
            return;
          }

          validFiles.push(compressedFile);
        } catch (error) {
          alert(`${file.name}: 画像の圧縮に失敗しました`);
        }
      } else {
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          alert(`${file.name}: ファイルサイズは10MB以下である必要があります`);
          return;
        }
        validFiles.push(file);
      }
    });

    // 少し遅延を入れて非同期処理を待つ
    setTimeout(() => {
      setSelectedImages(validFiles);
    }, 100);
  };

  // 画像圧縮関数を追加
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

  const uploadTreatmentImages = async (treatmentId: string) => {
    const uploadedImages = [];

    for (const file of selectedImages) {
      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`/api/treatments/${treatmentId}/images`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const imageData = await response.json();
          uploadedImages.push(imageData);
        } else {
          console.error(`画像 ${file.name} のアップロードに失敗しました`);
        }
      } catch (error) {
        console.error(`画像 ${file.name} のアップロードエラー:`, error);
      }
    }

    return uploadedImages;
  };

  const handleAddTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. 施術を作成
      const response = await fetch(`/api/customers/${params.id}/treatments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTreatment),
      });

      if (response.ok) {
        const treatment = await response.json();

        // 2. 画像をアップロード（選択されている場合）
        let uploadedImages = [];
        if (selectedImages.length > 0) {
          uploadedImages = await uploadTreatmentImages(treatment.id);
        }

        // 3. 顧客データを更新
        setCustomer((prev) =>
          prev
            ? {
                ...prev,
                treatments: [
                  { ...treatment, treatment_images: uploadedImages },
                  ...prev.treatments,
                ],
              }
            : null
        );

        // 4. フォームをリセット
        setIsTreatmentDialogOpen(false);
        setNewTreatment({
          date: "",
          menu: "",
          stylist_name: "",
          price: 0,
          duration: 0,
          notes: "",
        });
        setSelectedImages([]);

        // ファイル入力をリセット
        const fileInput = document.getElementById(
          "treatment-images"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      console.error("施術の追加に失敗しました:", error);
    } finally {
      setSubmitting(false);
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

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">顧客が見つかりません</h2>
          <Button onClick={() => router.push("/dashboard")}>
            ダッシュボードに戻る
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
              onClick={() => router.push("/dashboard")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">顧客詳細</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 顧客情報 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {customer.name}
                    </CardTitle>
                    <CardDescription>
                      {customer.gender && `${customer.gender} • `}
                      {customer.date_of_birth &&
                        `${formatDate(customer.date_of_birth)}生まれ`}
                    </CardDescription>
                  </div>
                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>顧客情報編集</DialogTitle>
                        <DialogDescription>
                          顧客の情報を更新してください
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleEditCustomer} className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">名前 *</Label>
                          <Input
                            id="edit-name"
                            value={editCustomer.name}
                            onChange={(e) =>
                              setEditCustomer({
                                ...editCustomer,
                                name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="edit-gender">性別</Label>
                          <Select
                            value={editCustomer.gender}
                            onValueChange={(value) =>
                              setEditCustomer({
                                ...editCustomer,
                                gender: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="性別を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="男性">男性</SelectItem>
                              <SelectItem value="女性">女性</SelectItem>
                              <SelectItem value="その他">その他</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="edit-date_of_birth">生年月日</Label>
                          <Input
                            id="edit-date_of_birth"
                            type="date"
                            value={editCustomer.date_of_birth}
                            onChange={(e) =>
                              setEditCustomer({
                                ...editCustomer,
                                date_of_birth: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="edit-phone">電話番号</Label>
                          <Input
                            id="edit-phone"
                            value={editCustomer.phone}
                            onChange={(e) =>
                              setEditCustomer({
                                ...editCustomer,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="edit-email">メールアドレス</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editCustomer.email}
                            onChange={(e) =>
                              setEditCustomer({
                                ...editCustomer,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="edit-notes">備考</Label>
                          <Textarea
                            id="edit-notes"
                            value={editCustomer.notes}
                            onChange={(e) =>
                              setEditCustomer({
                                ...editCustomer,
                                notes: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-1"
                          >
                            {submitting ? "更新中..." : "更新"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                          >
                            キャンセル
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.notes && (
                    <div className="pt-3 border-t">
                      <h4 className="font-medium mb-2">備考</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 施術履歴 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>施術履歴</CardTitle>
                  <Dialog
                    open={isTreatmentDialogOpen}
                    onOpenChange={setIsTreatmentDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        施術追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>新規施術追加</DialogTitle>
                        <DialogDescription>
                          新しい施術情報を入力してください
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddTreatment} className="space-y-4">
                        <div>
                          <Label htmlFor="treatment-date">施術日 *</Label>
                          <Input
                            id="treatment-date"
                            type="date"
                            value={newTreatment.date}
                            onChange={(e) =>
                              setNewTreatment({
                                ...newTreatment,
                                date: e.target.value,
                              })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="treatment-menu">メニュー *</Label>
                          <Input
                            id="treatment-menu"
                            value={newTreatment.menu}
                            onChange={(e) =>
                              setNewTreatment({
                                ...newTreatment,
                                menu: e.target.value,
                              })
                            }
                            placeholder="カット・カラー・パーマなど"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="treatment-stylist">
                            スタイリスト名 *
                          </Label>
                          <Input
                            id="treatment-stylist"
                            value={newTreatment.stylist_name}
                            onChange={(e) =>
                              setNewTreatment({
                                ...newTreatment,
                                stylist_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="treatment-price">料金（円）</Label>
                          <Input
                            id="treatment-price"
                            type="number"
                            min="0"
                            value={newTreatment.price}
                            onChange={(e) =>
                              setNewTreatment({
                                ...newTreatment,
                                price: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="treatment-duration">
                            施術時間（分）
                          </Label>
                          <Input
                            id="treatment-duration"
                            type="number"
                            min="0"
                            value={newTreatment.duration}
                            onChange={(e) =>
                              setNewTreatment({
                                ...newTreatment,
                                duration: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="treatment-notes">備考</Label>
                          <Textarea
                            id="treatment-notes"
                            value={newTreatment.notes}
                            onChange={(e) =>
                              setNewTreatment({
                                ...newTreatment,
                                notes: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="treatment-images">
                            画像（複数選択可能）
                          </Label>

                          {/* ファイル入力（非表示） */}
                          <input
                            id="treatment-images"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                          />

                          {/* アップロードボタン（iOS対応） */}
                          <div className="mt-2 flex flex-col sm:flex-row gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = document.getElementById(
                                  "treatment-images"
                                ) as HTMLInputElement;
                                if (input) {
                                  input.setAttribute("capture", "environment");
                                  input.click();
                                }
                              }}
                              className="flex-1 h-10 text-sm"
                            >
                              📷 写真を撮影
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = document.getElementById(
                                  "treatment-images"
                                ) as HTMLInputElement;
                                if (input) {
                                  input.removeAttribute("capture");
                                  input.click();
                                }
                              }}
                              className="flex-1 h-10 text-sm"
                            >
                              🖼️ ギャラリーから選択
                            </Button>
                          </div>

                          <p className="text-xs text-gray-500 mt-2 text-center">
                            JPEG、PNG、WebP、HEIC形式対応 / 最大10MBまで
                            <br />
                            大きな画像は自動的に圧縮されます
                          </p>

                          {selectedImages.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                選択された画像: {selectedImages.length}枚
                              </p>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedImages.map((file, index) => (
                                  <div
                                    key={index}
                                    className="text-xs text-gray-600 flex items-center justify-between p-2 bg-white rounded border"
                                  >
                                    <span className="truncate flex-1 mr-2">
                                      {file.name}
                                    </span>
                                    <span className="text-gray-400 whitespace-nowrap">
                                      {(file.size / 1024 / 1024).toFixed(1)}MB
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedImages([]);
                                  const input = document.getElementById(
                                    "treatment-images"
                                  ) as HTMLInputElement;
                                  if (input) input.value = "";
                                }}
                                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                              >
                                すべてクリア
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-1"
                          >
                            {submitting ? "追加中..." : "追加"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsTreatmentDialogOpen(false)}
                          >
                            キャンセル
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {customer.treatments && customer.treatments.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {customer.treatments.map((treatment, index) => (
                      <AccordionItem
                        key={treatment.id}
                        value={`treatment-${index}`}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {formatDate(treatment.date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Scissors className="h-4 w-4 text-gray-500" />
                                <span>{treatment.menu}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {treatment.price &&
                                `¥${treatment.price.toLocaleString()}`}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">施術詳細</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    スタイリスト: {treatment.stylist_name}
                                  </div>
                                  {treatment.duration && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      {treatment.duration}分
                                    </div>
                                  )}
                                  {treatment.price && (
                                    <div>
                                      料金: ¥{treatment.price.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/customers/${params.id}/treatments/${treatment.id}`
                                    )
                                  }
                                >
                                  画像を見る・追加
                                </Button>
                              </div>
                            </div>
                            {treatment.notes && (
                              <div>
                                <h4 className="font-medium mb-2">備考</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {treatment.notes}
                                </p>
                              </div>
                            )}
                            {treatment.treatment_images &&
                              treatment.treatment_images.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">
                                    画像 ({treatment.treatment_images.length}枚)
                                  </h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    {treatment.treatment_images
                                      .slice(0, 3)
                                      .map((image) => (
                                        <img
                                          key={image.id}
                                          src={image.image_url}
                                          alt="施術画像"
                                          className="w-full h-20 object-cover rounded border"
                                        />
                                      ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      施術履歴がありません
                    </h3>
                    <p className="text-gray-500 mb-4">
                      新しい施術を追加してください
                    </p>
                    <Button onClick={() => setIsTreatmentDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      施術追加
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
