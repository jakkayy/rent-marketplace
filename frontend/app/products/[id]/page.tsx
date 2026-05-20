"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, MessageCircle, Calendar, Tag, Palette, Ruler } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [availability, setAvailability] = useState<{ date: string; isBooked: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentalLoading, setRentalLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

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
    } catch {
      setMessage({ text: "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่", ok: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleRent() {
    if (!user) {
      setMessage({ text: "กรุณาเข้าสู่ระบบก่อน", ok: false });
      return;
    }
    if (startDate >= endDate) {
      setMessage({ text: "วันคืนต้องหลังวันรับ", ok: false });
      return;
    }
    setRentalLoading(true);
    setMessage(null);
    try {
      await api.rentals.create({ productId: id, startDate, endDate });
      setMessage({ text: "จองสำเร็จ! ร้านค้าจะยืนยันการจองเร็วๆ นี้", ok: true });
      loadData();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "จองไม่สำเร็จ", ok: false });
    } finally {
      setRentalLoading(false);
    }
  }

  async function handleLineContact() {
    if (!product?.shop?.lineId) return;
    try {
      await api.products.contact(id, "product_detail");
    } catch {
      // tracking ล้มเหลวไม่ควร block user
    }
    window.open(
      `https://line.me/ti/p/~${encodeURIComponent(product.shop.lineId)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground">กำลังโหลด...</div>;
  if (!product) return <div className="py-20 text-center text-muted-foreground">ไม่พบสินค้า</div>;

  const bookedDates = new Set(
    availability.filter((a) => a.isBooked).map((a) => a.date.split("T")[0])
  );

  const totalDays =
    startDate && endDate && endDate > startDate
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1
      : 0;
  const totalPrice = totalDays > 0 ? totalDays * Number(product.pricePerDay) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-xl bg-muted overflow-hidden">
            {product.images?.[selectedImage] ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                ไม่มีรูป
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                    selectedImage === i ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} className="h-full w-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <Badge className="mb-2">{product.category?.name}</Badge>
          <h1 className="mb-2 text-2xl font-bold">{product.name}</h1>
          <p className="mb-4 text-muted-foreground">{product.description || "ไม่มีรายละเอียด"}</p>

          <div className="mb-4 text-3xl font-bold text-primary">
            ฿{Number(product.pricePerDay).toLocaleString()}
            <span className="text-lg font-normal text-muted-foreground"> /วัน</span>
          </div>

          {/* Attributes */}
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            {product.brand && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Tag className="h-3 w-3" /> {product.brand}
              </span>
            )}
            {product.color && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Palette className="h-3 w-3" /> {product.color}
              </span>
            )}
            {product.size && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Ruler className="h-3 w-3" /> ไซส์ {product.size}
              </span>
            )}
            {product.condition && (
              <span className="rounded-full bg-muted px-3 py-1">สภาพ: {product.condition}</span>
            )}
          </div>

          {product.deposit && (
            <p className="mb-4 text-sm text-muted-foreground">
              มัดจำ ฿{Number(product.deposit).toLocaleString()}
            </p>
          )}

          {/* Shop info */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="mb-2 font-semibold">ร้านค้า</h3>
              <div className="flex items-center gap-3">
                {product.shop?.logo && (
                  <img
                    src={product.shop.logo}
                    className="h-10 w-10 rounded-full object-cover"
                    alt=""
                  />
                )}
                <div>
                  <Link
                    href={`/shops/${product.shop?.id}`}
                    className="font-medium hover:underline"
                  >
                    {product.shop?.name}
                  </Link>
                  {product.shop?.district && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {product.shop.district}
                    </div>
                  )}
                  {product.shop?.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {product.shop.phone}
                    </div>
                  )}
                </div>
              </div>
              {product.shop?.lineId && (
                <button
                  onClick={handleLineContact}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  ติดต่อร้านค้าผ่าน LINE
                </button>
              )}
            </CardContent>
          </Card>

          {/* Date picker */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4" />
                เลือกวันเช่า
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">วันรับ</label>
                  <Input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">วันคืน</label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              {totalDays > 0 && (
                <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">จำนวน {totalDays} วัน</span>
                    <span className="font-semibold text-primary">
                      รวม ฿{totalPrice.toLocaleString()}
                    </span>
                  </div>
                  {product.deposit && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>มัดจำ</span>
                      <span>฿{Number(product.deposit).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Availability */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                วันที่ถูกจองในช่วง 5 สัปดาห์ข้างหน้า
              </h3>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
                  <div key={d} className="py-1 font-medium text-muted-foreground">
                    {d}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split("T")[0];
                  const isBooked = bookedDates.has(dateStr);
                  return (
                    <div
                      key={i}
                      className={`rounded py-1 ${
                        isBooked
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" /> ว่าง
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> ถูกจอง
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleRent}
            disabled={rentalLoading || totalDays <= 0}
          >
            {rentalLoading ? "กำลังจอง..." : totalDays > 0 ? `จองเช่า ฿${totalPrice.toLocaleString()}` : "เลือกวันก่อนจอง"}
          </Button>

          {message && (
            <p className={`mt-2 text-sm ${message.ok ? "text-green-600" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
