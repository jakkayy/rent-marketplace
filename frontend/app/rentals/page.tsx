"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Rental } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package } from "lucide-react";
import Link from "next/link";

const STATUS_MAP: Record<Rental["status"], { label: string; className: string }> = {
  PENDING:   { label: "รอยืนยัน",    className: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "ยืนยันแล้ว",  className: "bg-blue-100 text-blue-800" },
  REJECTED:  { label: "ถูกปฏิเสธ",   className: "bg-red-100 text-red-800" },
  ACTIVE:    { label: "กำลังเช่า",   className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "เสร็จสิ้น",   className: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "ยกเลิกแล้ว",  className: "bg-gray-100 text-gray-500" },
};

export default function RentalsPage() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    loadRentals();
  }, [user]);

  async function loadRentals() {
    setLoading(true);
    try {
      const res = await api.rentals.my();
      setRentals(res.data);
    } catch {
      setError("โหลดรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(rentalId: string) {
    if (!confirm("ยืนยันการยกเลิกการจอง?")) return;
    setCancellingId(rentalId);
    try {
      await api.rentals.cancel(rentalId);
      setRentals((prev) =>
        prev.map((r) => (r.id === rentalId ? { ...r, status: "CANCELLED" } : r))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "ยกเลิกไม่สำเร็จ");
    } finally {
      setCancellingId(null);
    }
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-muted-foreground">กรุณาเข้าสู่ระบบก่อน</p>
        <Link href="/login">
          <Button>เข้าสู่ระบบ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">รายการเช่าของฉัน</h1>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">กำลังโหลด...</div>
      ) : rentals.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Package className="mx-auto mb-2 h-10 w-10 opacity-30" />
          ยังไม่มีรายการเช่า
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => {
            const status = STATUS_MAP[rental.status];
            const canCancel = rental.status === "PENDING" || rental.status === "CONFIRMED";
            return (
              <Card key={rental.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                        {rental.product?.images?.[0] ? (
                          <img
                            src={rental.product.images[0]}
                            className="h-full w-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/products/${rental.product?.id}`}
                          className="font-semibold hover:underline"
                        >
                          {rental.product?.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{rental.shop?.name}</p>
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(rental.startDate).toLocaleDateString("th-TH")} –{" "}
                          {new Date(rental.endDate).toLocaleDateString("th-TH")}
                          <span className="ml-1">({rental.totalDays} วัน)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge className={status.className}>{status.label}</Badge>
                      <p className="text-lg font-bold text-primary">
                        ฿{Number(rental.totalPrice).toLocaleString()}
                      </p>
                      {canCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={cancellingId === rental.id}
                          onClick={() => handleCancel(rental.id)}
                        >
                          {cancellingId === rental.id ? "กำลังยกเลิก..." : "ยกเลิก"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
