"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, MessageCircle, Calendar, Star } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentalLoading, setRentalLoading] = useState(false);
  const [rentalMessage, setRentalMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [prod, avail] = await Promise.all([
        api.products.get(id),
        api.products.availability(id),
      ]);
      setProduct(prod);
      setAvailability(avail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRent() {
    if (!user) {
      setRentalMessage("กรุณาเข้าสู่ระบบก่อน");
      return;
    }
    setRentalLoading(true);
    setRentalMessage("");
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 3);
      await api.rentals.create({
        productId: id,
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      });
      setRentalMessage("จองสำเร็จ! ตรวจสอบรายการเช่าได้ที่เมนู");
      loadData();
    } catch (err: any) {
      setRentalMessage(err.message || "จองไม่สำเร็จ");
    } finally {
      setRentalLoading(false);
    }
  }

  if (loading) return <div className="py-20 text-center">กำลังโหลด...</div>;
  if (!product) return <div className="py-20 text-center">ไม่พบสินค้า</div>;

  const bookedDates = new Set(availability.filter((a) => a.isBooked).map((a) => a.date.split("T")[0]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-xl bg-muted overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">ไม่มีรูป</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {product.images.map((img: string, i: number) => (
                <img key={i} src={img} className="h-20 w-20 rounded-lg object-cover" alt="" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <Badge className="mb-2">{product.category?.name}</Badge>
          <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
          <p className="mb-4 text-muted-foreground">{product.description || "ไม่มีรายละเอียด"}</p>

          <div className="mb-6 text-3xl font-bold text-primary">
            ฿{Number(product.pricePerDay).toLocaleString()}
            <span className="text-lg font-normal text-muted-foreground"> /วัน</span>
          </div>

          {product.condition && (
            <div className="mb-4 text-sm">
              <span className="font-medium">สภาพสินค้า:</span> {product.condition}
            </div>
          )}

          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="mb-2 font-semibold">ร้านค้า</h3>
              <div className="flex items-center gap-3">
                {product.shop?.logo && (
                  <img src={product.shop.logo} className="h-12 w-12 rounded-full object-cover" alt="" />
                )}
                <div>
                  <Link href={`/shops/${product.shop?.id}`} className="font-medium hover:underline">
                    {product.shop?.name}
                  </Link>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {product.shop?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {product.shop.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {product.shop?.lineId && (
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(product.shop.lineId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  ติดต่อร้านค้าผ่าน LINE
                </a>
              )}
            </CardContent>
          </Card>

          {/* Availability Calendar Preview */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4" />
                ตารางวันว่าง
              </h3>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
                  <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split("T")[0];
                  const isBooked = bookedDates.has(dateStr);
                  return (
                    <div
                      key={i}
                      className={`rounded py-1 ${isBooked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> ว่าง</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> ถูกจอง</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button size="lg" className="flex-1" onClick={handleRent} disabled={rentalLoading}>
              {rentalLoading ? "กำลังจอง..." : "จองเช่า"}
            </Button>
          </div>
          {rentalMessage && (
            <p className={`mt-2 text-sm ${rentalMessage.includes("สำเร็จ") ? "text-green-600" : "text-red-600"}`}>
              {rentalMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
