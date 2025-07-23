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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Admin, CustomerWithTreatments } from "@/types";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  LogOut,
  Mail,
  Phone,
  Plus,
  Shield,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../providers";

export default function DashboardPage() {
  const [allCustomers, setAllCustomers] = useState<CustomerWithTreatments[]>(
    []
  );
  const [filteredCustomers, setFilteredCustomers] = useState<
    CustomerWithTreatments[]
  >([]);
  const [paginatedCustomers, setPaginatedCustomers] = useState<
    CustomerWithTreatments[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_desc");

  // ページネーション関連
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 1ページあたりの表示件数

  // モバイル用フィルターの表示状態
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { user, supabase } = useAuth();
  const router = useRouter();

  // 新しいタブ管理の状態
  const [activeTab, setActiveTab] = useState<"customers" | "admins">(
    "customers"
  );

  // 管理者管理の状態
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
  const [isEditAdminDialogOpen, setIsEditAdminDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });

  // 管理者移行の状態
  const [needsAdminMigration, setNeedsAdminMigration] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // 年齢計算用関数
  const calculateAge = (dateOfBirth: string | null): number => {
    if (!dateOfBirth) return 0;
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // 最新施術日取得用関数
  const getLatestTreatmentDate = (
    treatments: { date: string }[]
  ): Date | null => {
    if (!treatments || treatments.length === 0) return null;
    return new Date(
      Math.max(...treatments.map((t) => new Date(t.date).getTime()))
    );
  };

  useEffect(() => {
    if (user) {
      fetchCustomers();
      checkAdminStatus();
    }
  }, [user]);

  // 現在のユーザーが管理者として登録されているかチェック
  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/admins");

      if (response.status === 403) {
        // 管理者権限がない = 管理者テーブルに登録されていない
        setNeedsAdminMigration(true);
        setShowMigrationDialog(true);
      } else if (response.ok) {
        // 管理者として正常にアクセスできる
        setNeedsAdminMigration(false);
      }
    } catch (error) {
      console.error("管理者状態チェックエラー:", error);
    }
  };

  // 現在のユーザーを管理者として登録
  const handleAdminMigration = async () => {
    setMigrating(true);
    try {
      const response = await fetch("/api/admins/migrate", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        setNeedsAdminMigration(false);
        setShowMigrationDialog(false);

        if (result.isFirstAdmin) {
          alert(
            "初回管理者として登録されました！\nスーパー管理者権限が付与されています。"
          );
        } else {
          alert("管理者として登録されました！");
        }

        // データを再取得
        await fetchCustomers();
      } else {
        const error = await response.json();
        alert(`管理者登録に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("管理者移行エラー:", error);
      alert("移行エラーが発生しました");
    } finally {
      setMigrating(false);
    }
  };

  // 管理者データを取得
  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await fetch("/api/admins");
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error("管理者データの取得に失敗しました:", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // 新規管理者追加
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAdmin),
      });

      if (response.ok) {
        await fetchAdmins();
        setIsAddAdminDialogOpen(false);
        setNewAdmin({
          name: "",
          email: "",
          password: "",
          role: "admin",
        });
        alert("管理者を追加しました");
      } else {
        const error = await response.json();
        alert(`追加に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("管理者の追加に失敗しました:", error);
      alert("追加エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  // 管理者編集
  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/admins/${editingAdmin.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingAdmin.name,
          role: editingAdmin.role,
          is_active: editingAdmin.is_active,
        }),
      });

      if (response.ok) {
        await fetchAdmins();
        setIsEditAdminDialogOpen(false);
        setEditingAdmin(null);
        alert("管理者情報を更新しました");
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("管理者の更新に失敗しました:", error);
      alert("更新エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  // 管理者削除
  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("この管理者を削除しますか？この操作は取り消せません。")) {
      return;
    }

    try {
      const response = await fetch(`/api/admins/${adminId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAdmins();
        alert("管理者を削除しました");
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("管理者の削除に失敗しました:", error);
      alert("削除エラーが発生しました");
    }
  };

  // タブ切り替え時のデータ取得
  const handleTabChange = (tab: "customers" | "admins") => {
    setActiveTab(tab);
    if (tab === "admins" && admins.length === 0) {
      fetchAdmins();
    }
  };

  // フィルタリング・ソートを直接useEffectで実行
  useEffect(() => {
    let filtered = [...allCustomers];

    // 名前検索
    if (searchTerm) {
      filtered = filtered.filter((customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 性別フィルター
    if (genderFilter !== "all") {
      filtered = filtered.filter(
        (customer) => customer.gender === genderFilter
      );
    }

    // 年齢フィルター
    if (minAge || maxAge) {
      filtered = filtered.filter((customer) => {
        const age = calculateAge(customer.date_of_birth);
        const min = minAge ? parseInt(minAge) : 0;
        const max = maxAge ? parseInt(maxAge) : 200;
        return age >= min && age <= max;
      });
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name, "ja");
        case "name_desc":
          return b.name.localeCompare(a.name, "ja");
        case "created_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "created_desc":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "age_asc":
          return calculateAge(a.date_of_birth) - calculateAge(b.date_of_birth);
        case "age_desc":
          return calculateAge(b.date_of_birth) - calculateAge(a.date_of_birth);
        case "treatments_asc":
          return (a.treatments?.length || 0) - (b.treatments?.length || 0);
        case "treatments_desc":
          return (b.treatments?.length || 0) - (a.treatments?.length || 0);
        case "latest_treatment_asc":
          const aLatest = getLatestTreatmentDate(a.treatments || []);
          const bLatest = getLatestTreatmentDate(b.treatments || []);
          if (!aLatest && !bLatest) return 0;
          if (!aLatest) return 1;
          if (!bLatest) return -1;
          return aLatest.getTime() - bLatest.getTime();
        case "latest_treatment_desc":
          const aLatestDesc = getLatestTreatmentDate(a.treatments || []);
          const bLatestDesc = getLatestTreatmentDate(b.treatments || []);
          if (!aLatestDesc && !bLatestDesc) return 0;
          if (!aLatestDesc) return 1;
          if (!bLatestDesc) return -1;
          return bLatestDesc.getTime() - aLatestDesc.getTime();
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    setFilteredCustomers(filtered);
    // フィルター変更時は1ページ目に戻る
    setCurrentPage(1);
  }, [allCustomers, searchTerm, genderFilter, minAge, maxAge, sortBy]);

  // ページネーション用のuseEffect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredCustomers.slice(startIndex, endIndex);
    setPaginatedCustomers(paginated);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // ページネーション計算
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    currentPage * itemsPerPage,
    filteredCustomers.length
  );

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setAllCustomers(data);
      }
    } catch (error) {
      console.error("顧客データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        const customer = await response.json();
        setAllCustomers([customer, ...allCustomers]);
        setIsAddDialogOpen(false);
        setNewCustomer({
          name: "",
          gender: "",
          date_of_birth: "",
          phone: "",
          email: "",
          notes: "",
        });
      }
    } catch (error) {
      console.error("顧客の追加に失敗しました:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // ページ変更時にトップにスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // モバイル用のシンプルなページネーション番号生成
  const getMobilePageNumbers = () => {
    const pages = [];
    const maxVisible = 3;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3);
      } else if (currentPage >= totalPages - 1) {
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(currentPage - 1, currentPage, currentPage + 1);
      }
    }

    return pages;
  };

  // デスクトップ用のページネーション番号生成
  const getDesktopPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const hasActiveFilters =
    genderFilter !== "all" || minAge || maxAge || searchTerm;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
              美容室管理システム
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:block text-sm text-gray-600">
                {user?.email}
              </span>
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">ログアウト</span>
              </Button>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange("customers")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "customers"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                顧客管理
              </button>
              <button
                onClick={() => handleTabChange("admins")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "admins"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Shield className="h-4 w-4 inline mr-2" />
                管理者管理
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {activeTab === "customers" ? (
          // 顧客管理コンテンツ
          <>
            {/* 検索・フィルター・ソートエリア */}
            <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
              {/* 検索と新規追加 */}
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
                <div className="flex-1">
                  <Input
                    placeholder="顧客名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* モバイル：フィルターボタン */}
                <div className="flex gap-2 sm:hidden">
                  <Button
                    variant={hasActiveFilters ? "default" : "outline"}
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex-1 relative"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    フィルター
                    {hasActiveFilters && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </Button>
                  <Dialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        新規追加
                      </Button>
                    </DialogTrigger>
                    {/* ダイアログ内容は同じなので省略 */}
                    <DialogContent className="sm:max-w-md mx-3">
                      <DialogHeader>
                        <DialogTitle>新規顧客追加</DialogTitle>
                        <DialogDescription>
                          新しい顧客の情報を入力してください
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddCustomer} className="space-y-4">
                        <div>
                          <Label htmlFor="name">名前 *</Label>
                          <Input
                            id="name"
                            value={newCustomer.name}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="gender">性別</Label>
                          <Select
                            value={newCustomer.gender}
                            onValueChange={(value) =>
                              setNewCustomer({ ...newCustomer, gender: value })
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
                          <Label htmlFor="date_of_birth">生年月日</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={newCustomer.date_of_birth}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                date_of_birth: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone">電話番号</Label>
                          <Input
                            id="phone"
                            value={newCustomer.phone}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="email">メールアドレス</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="notes">備考</Label>
                          <Textarea
                            id="notes"
                            value={newCustomer.notes}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
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
                            {submitting ? "追加中..." : "追加"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                          >
                            キャンセル
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* デスクトップ：新規追加ボタン */}
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="hidden sm:flex">
                      <Plus className="h-4 w-4 mr-2" />
                      新規顧客追加
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>

              {/* モバイル：フィルターエリア（展開式） */}
              {showMobileFilters && (
                <div className="sm:hidden bg-white rounded-lg border p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">フィルター・ソート</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* 性別フィルター */}
                    <div>
                      <Label htmlFor="gender-filter-mobile">性別</Label>
                      <Select
                        value={genderFilter}
                        onValueChange={setGenderFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="すべて" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          <SelectItem value="男性">男性</SelectItem>
                          <SelectItem value="女性">女性</SelectItem>
                          <SelectItem value="その他">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 年齢フィルター */}
                    <div>
                      <Label>年齢範囲</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          placeholder="最小"
                          value={minAge}
                          onChange={(e) => setMinAge(e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500">〜</span>
                        <Input
                          type="number"
                          placeholder="最大"
                          value={maxAge}
                          onChange={(e) => setMaxAge(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* ソート */}
                    <div>
                      <Label htmlFor="sort-by-mobile">並び順</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_desc">
                            登録日（新しい順）
                          </SelectItem>
                          <SelectItem value="created_asc">
                            登録日（古い順）
                          </SelectItem>
                          <SelectItem value="name_asc">
                            名前（あいうえお順）
                          </SelectItem>
                          <SelectItem value="name_desc">
                            名前（逆順）
                          </SelectItem>
                          <SelectItem value="age_asc">
                            年齢（若い順）
                          </SelectItem>
                          <SelectItem value="age_desc">
                            年齢（高い順）
                          </SelectItem>
                          <SelectItem value="treatments_desc">
                            施術回数（多い順）
                          </SelectItem>
                          <SelectItem value="treatments_asc">
                            施術回数（少ない順）
                          </SelectItem>
                          <SelectItem value="latest_treatment_desc">
                            最終来店日（新しい順）
                          </SelectItem>
                          <SelectItem value="latest_treatment_asc">
                            最終来店日（古い順）
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* リセットボタン */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setGenderFilter("all");
                        setMinAge("");
                        setMaxAge("");
                        setSortBy("created_desc");
                      }}
                      className="w-full"
                    >
                      フィルターをリセット
                    </Button>
                  </div>
                </div>
              )}

              {/* デスクトップ：フィルター・ソートエリア */}
              <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
                {/* 性別フィルター */}
                <div>
                  <Label htmlFor="gender-filter">性別</Label>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="男性">男性</SelectItem>
                      <SelectItem value="女性">女性</SelectItem>
                      <SelectItem value="その他">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 年齢フィルター */}
                <div>
                  <Label>年齢範囲</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="最小"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      className="w-20"
                    />
                    <span className="self-center">〜</span>
                    <Input
                      type="number"
                      placeholder="最大"
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
                      className="w-20"
                    />
                  </div>
                </div>

                {/* ソート */}
                <div>
                  <Label htmlFor="sort-by">並び順</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_desc">
                        登録日（新しい順）
                      </SelectItem>
                      <SelectItem value="created_asc">
                        登録日（古い順）
                      </SelectItem>
                      <SelectItem value="name_asc">
                        名前（あいうえお順）
                      </SelectItem>
                      <SelectItem value="name_desc">名前（逆順）</SelectItem>
                      <SelectItem value="age_asc">年齢（若い順）</SelectItem>
                      <SelectItem value="age_desc">年齢（高い順）</SelectItem>
                      <SelectItem value="treatments_desc">
                        施術回数（多い順）
                      </SelectItem>
                      <SelectItem value="treatments_asc">
                        施術回数（少ない順）
                      </SelectItem>
                      <SelectItem value="latest_treatment_desc">
                        最終来店日（新しい順）
                      </SelectItem>
                      <SelectItem value="latest_treatment_asc">
                        最終来店日（古い順）
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 結果表示 */}
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    <div>検索結果: {filteredCustomers.length}件</div>
                    <div className="text-xs">
                      総顧客数: {allCustomers.length}件
                    </div>
                  </div>
                </div>
              </div>

              {/* デスクトップ：フィルターリセット */}
              <div className="hidden sm:flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setGenderFilter("all");
                    setMinAge("");
                    setMaxAge("");
                    setSortBy("created_desc");
                  }}
                  className="text-sm"
                >
                  フィルターをリセット
                </Button>
              </div>
            </div>

            {/* ページネーション情報 */}
            {filteredCustomers.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div className="text-sm text-gray-600">
                  <span className="sm:hidden">
                    {currentPage}/{totalPages}ページ ({filteredCustomers.length}
                    件)
                  </span>
                  <span className="hidden sm:inline">
                    {startIndex}〜{endIndex}件 / 全{filteredCustomers.length}
                    件中 (ページ {currentPage}/{totalPages})
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  1ページあたり{itemsPerPage}件表示
                </div>
              </div>
            )}

            {/* 顧客一覧 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paginatedCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="truncate">{customer.name}</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {customer.gender && `${customer.gender} • `}
                      {customer.date_of_birth &&
                        `${calculateAge(customer.date_of_birth)}歳 • `}
                      {customer.date_of_birth &&
                        `${formatDate(customer.date_of_birth)}生まれ`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate">
                          最終更新: {formatDate(customer.updated_at)}
                        </span>
                      </div>
                      {customer.treatments && (
                        <div className="pt-1 sm:pt-2 space-y-1">
                          <div className="text-blue-600 font-medium text-xs sm:text-sm">
                            施術履歴: {customer.treatments.length}件
                          </div>
                          {customer.treatments.length > 0 && (
                            <div className="text-xs text-gray-500">
                              最終来店:{" "}
                              {formatDate(
                                getLatestTreatmentDate(
                                  customer.treatments
                                )?.toISOString() || ""
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <>
                {/* モバイルページネーション */}
                <div className="mt-6 sm:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      前へ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      size="sm"
                    >
                      次へ
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  {/* モバイル：シンプルなページ番号 */}
                  <div className="flex justify-center gap-1">
                    {getMobilePageNumbers().map((page, index) => (
                      <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="min-w-[40px] h-8"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* デスクトップページネーション */}
                <div className="mt-8 hidden sm:flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* 前へ・次へボタン */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      前へ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2"
                    >
                      次へ
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* ページ番号 */}
                  <div className="flex items-center gap-1">
                    {getDesktopPageNumbers().map((page, index) => (
                      <div key={index}>
                        {page === "..." ? (
                          <span className="px-3 py-2 text-gray-400">...</span>
                        ) : (
                          <Button
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page as number)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ページジャンプ */}
                  <div className="flex items-center gap-2 text-sm">
                    <span>ページ:</span>
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          handlePageChange(page);
                        }
                      }}
                      className="w-16 text-center"
                    />
                    <span>/ {totalPages}</span>
                  </div>
                </div>
              </>
            )}

            {filteredCustomers.length === 0 && !loading && (
              <div className="text-center py-8 sm:py-12">
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || genderFilter !== "all" || minAge || maxAge
                    ? "検索条件に一致する顧客がいません"
                    : "顧客がいません"}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  {searchTerm || genderFilter !== "all" || minAge || maxAge
                    ? "フィルター条件を変更してください"
                    : "新しい顧客を追加してください"}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新規顧客追加
                </Button>
              </div>
            )}
          </>
        ) : (
          // 管理者管理コンテンツ
          <div className="space-y-6">
            {/* 管理者管理ヘッダー */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  管理者管理
                </h2>
                <p className="text-sm text-gray-600">
                  システム管理者の追加・編集・削除
                </p>
              </div>
              <Dialog
                open={isAddAdminDialogOpen}
                onOpenChange={setIsAddAdminDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    管理者追加
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>新規管理者追加</DialogTitle>
                    <DialogDescription>
                      新しい管理者の情報を入力してください
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="admin-name">名前 *</Label>
                      <Input
                        id="admin-name"
                        value={newAdmin.name}
                        onChange={(e) =>
                          setNewAdmin({ ...newAdmin, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-email">メールアドレス *</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) =>
                          setNewAdmin({ ...newAdmin, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-password">パスワード *</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) =>
                          setNewAdmin({ ...newAdmin, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-role">権限</Label>
                      <Select
                        value={newAdmin.role}
                        onValueChange={(value) =>
                          setNewAdmin({ ...newAdmin, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理者</SelectItem>
                          <SelectItem value="super_admin">
                            スーパー管理者
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
                        onClick={() => setIsAddAdminDialogOpen(false)}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* 管理者一覧 */}
            {loadingAdmins ? (
              <div className="text-center py-8">
                <div className="text-lg">読み込み中...</div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium">
                    管理者一覧 ({admins.length}名)
                  </h3>
                </div>
                <div className="divide-y">
                  {admins.map((admin) => (
                    <div key={admin.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {admin.name}
                          </h4>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                admin.role === "super_admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {admin.role === "super_admin"
                                ? "スーパー管理者"
                                : "管理者"}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                admin.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {admin.is_active ? "有効" : "無効"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAdmin(admin);
                              setIsEditAdminDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            編集
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            削除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {admins.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      管理者がいません
                    </h3>
                    <p className="text-gray-500 mb-4">
                      新しい管理者を追加してください
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 管理者編集ダイアログ */}
            <Dialog
              open={isEditAdminDialogOpen}
              onOpenChange={setIsEditAdminDialogOpen}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>管理者編集</DialogTitle>
                  <DialogDescription>
                    管理者の情報を更新してください
                  </DialogDescription>
                </DialogHeader>
                {editingAdmin && (
                  <form onSubmit={handleEditAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="edit-admin-name">名前 *</Label>
                      <Input
                        id="edit-admin-name"
                        value={editingAdmin.name}
                        onChange={(e) =>
                          setEditingAdmin({
                            ...editingAdmin,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-admin-role">権限</Label>
                      <Select
                        value={editingAdmin.role}
                        onValueChange={(value) =>
                          setEditingAdmin({ ...editingAdmin, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理者</SelectItem>
                          <SelectItem value="super_admin">
                            スーパー管理者
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-admin-active"
                        checked={editingAdmin.is_active}
                        onChange={(e) =>
                          setEditingAdmin({
                            ...editingAdmin,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      <Label htmlFor="edit-admin-active">有効</Label>
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
                        onClick={() => setIsEditAdminDialogOpen(false)}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* 管理者移行ダイアログ */}
        <Dialog open={showMigrationDialog} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                管理者権限の設定
              </DialogTitle>
              <DialogDescription>
                管理者機能を使用するために、アカウントを管理者として登録する必要があります。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  なぜ必要ですか？
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• セキュリティ強化のため管理者認証を導入しました</li>
                  <li>• 既存のデータに引き続きアクセスできます</li>
                  <li>• 追加管理者の招待も可能になります</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>登録内容:</strong>
                  <br />
                  メールアドレス: {user?.email}
                  <br />
                  権限: {needsAdminMigration ? "管理者" : "スーパー管理者"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAdminMigration}
                  disabled={migrating}
                  className="flex-1"
                >
                  {migrating ? "登録中..." : "管理者として登録"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={migrating}
                >
                  ログアウト
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
