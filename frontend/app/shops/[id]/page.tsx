"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, MessageCircle } from "lucide-react";

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadShop();
  }, [id]);

  async function loadShop() {
    setLoading(true);
    try {
      const data = await api.shops.get(id);
      setShop(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="py-20 text-center">กำลังโหลด...</div>;
  if (!shop) return <div className="py-20 text-center">ไม่พบร้านค้า</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Shop Header */}
      <div className="mb-8 rounded-2xl bg-muted p-6">
        <div className="flex items-center gap-4">
          {shop.logo ? (
            <img src={shop.logo} alt={shop.name} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {shop.name?.[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{shop.name}</h1>
            <p className="text-muted-foreground">{shop.description}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {shop.address && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {shop.address}</span>
              )}
              {shop.phone && (
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {shop.phone}</span>
              )}
            </div>
            {shop.lineId && (
              <a
                href={`https://line.me/ti/p/~${encodeURIComponent(shop.lineId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                <MessageCircle className="h-4 w-4" />
                ติดต่อผ่าน LINE
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="mb-4 text-xl font-semibold">สินค้าในร้าน</h2>
      {shop.products?.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">ยังไม่มีสินค้า</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shop.products.map((product: any) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                <div className="aspect-video bg-muted">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">ไม่มีรูป</div>
                  )}
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2">{product.category?.name}</Badge>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm font-semibold text-primary">
                    ฿{Number(product.pricePerDay).toLocaleString()}/วัน
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
