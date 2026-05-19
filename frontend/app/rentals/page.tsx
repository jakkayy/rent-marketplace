"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package } from "lucide-react";

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รอการยืนยัน", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-800" },
  ACTIVE: { label: "กำลังเช่า", color: "bg-green-100 text-green-800" },
  COMPLETED: { label: "เสร็จสิ้น", color: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "ยกเลิก", color: "bg-red-100 text-red-800" },
};

export default function RentalsPage() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadRentals();
  }, [user]);

  async function loadRentals() {
    setLoading(true);
    try {
      const data = await api.rentals.my();
      setRentals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <div className="py-20 text-center">กรุณาเข้าสู่ระบบก่อน</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">รายการเช่าของฉัน</h1>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">กำลังโหลด...</div>
      ) : rentals.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">ยังไม่มีรายการเช่า</div>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => (
            <Card key={rental.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden">
                      {rental.product?.images?.[0] ? (
                        <img src={rental.product.images[0]} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{rental.product?.name}</h3>
                      <p className="text-sm text-muted-foreground">{rental.shop?.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(rental.startDate).toLocaleDateString("th-TH")} - {new Date(rental.endDate).toLocaleDateString("th-TH")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={statusMap[rental.status]?.color || ""}>
                      {statusMap[rental.status]?.label || rental.status}
                    </Badge>
                    <p className="mt-2 text-lg font-bold text-primary">
                      ฿{Number(rental.totalPrice).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
