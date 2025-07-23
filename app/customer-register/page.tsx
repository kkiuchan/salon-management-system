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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";

export default function CustomerRegisterPage() {
  const [customerData, setCustomerData] = useState({
    name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/customer-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const error = await response.json();
        alert(`登録に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("登録エラー:", error);
      alert("登録エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                登録完了！
              </h2>
              <p className="text-gray-600 mb-4">
                お客様情報の登録が完了しました。
                <br />
                スタッフが確認後、システムに反映されます。
              </p>
              <p className="text-sm text-gray-500">
                ありがとうございました。
                <br />
                このページを閉じていただけます。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            お客様情報入力
          </h1>
          <p className="text-gray-600">
            初回来店の方は以下の情報をご入力ください
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">基本情報</CardTitle>
            <CardDescription>
              必要な項目を入力してください（*は必須項目）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 名前 */}
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  お名前 *
                </Label>
                <Input
                  id="name"
                  value={customerData.name}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, name: e.target.value })
                  }
                  placeholder="山田 太郎"
                  required
                  className="mt-2"
                />
              </div>

              {/* 性別 */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  性別
                </Label>
                <Select
                  value={customerData.gender}
                  onValueChange={(value) =>
                    setCustomerData({ ...customerData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="男性">男性</SelectItem>
                    <SelectItem value="女性">女性</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 生年月日 */}
              <div>
                <Label
                  htmlFor="date_of_birth"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  生年月日
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={customerData.date_of_birth}
                  onChange={(e) =>
                    setCustomerData({
                      ...customerData,
                      date_of_birth: e.target.value,
                    })
                  }
                  className="mt-2"
                />
              </div>

              {/* 電話番号 */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  電話番号
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, phone: e.target.value })
                  }
                  placeholder="090-1234-5678"
                  className="mt-2"
                />
              </div>

              {/* メールアドレス */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, email: e.target.value })
                  }
                  placeholder="example@email.com"
                  className="mt-2"
                />
              </div>

              {/* 備考・要望 */}
              <div>
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  ご要望・アレルギーなど
                </Label>
                <Textarea
                  id="notes"
                  value={customerData.notes}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, notes: e.target.value })
                  }
                  placeholder="カラーアレルギーがある、短時間での施術希望など..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !customerData.name.trim()}
                className="w-full h-12 text-lg"
              >
                {submitting ? "登録中..." : "登録する"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            入力いただいた情報は、サービス向上のためのみに使用いたします。
            <br />
            個人情報の取り扱いについては、プライバシーポリシーをご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
}
