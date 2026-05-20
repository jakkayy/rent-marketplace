"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Shop } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Phone, MessageCircle, Store } from "lucide-react";

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadShops = useCallback(async (q: string, d: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.shops.list({ ...(q && { q }), ...(d && { district: d }) });
      setShops(res.data);
    } catch {
      setError("โหลดร้านค้าไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops("", "");
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadShops(search, district);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">ร้านค้าทั้งหมด</h1>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาร้านค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          placeholder="ย่าน เช่น สยาม"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="w-36"
        />
        <Button type="submit">ค้นหา</Button>
      </form>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">กำลังโหลด...</div>
      ) : shops.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Store className="mx-auto mb-2 h-10 w-10 opacity-30" />
          ไม่พบร้านค้า
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Link key={shop.id} href={`/shops/${shop.id}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                <div className="aspect-video bg-muted overflow-hidden">
                  {shop.banner ? (
                    <img src={shop.banner} alt={shop.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Store className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {shop.logo ? (
                      <img src={shop.logo} className="h-10 w-10 rounded-full object-cover border" alt="" />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {shop.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{shop.name}</h3>
                      {shop.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{shop.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {shop.district && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {shop.district}
                      </span>
                    )}
                    {shop.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {shop.phone}
                      </span>
                    )}
                    {shop.lineId && (
                      <span className="flex items-center gap-1 text-green-600">
                        <MessageCircle className="h-3 w-3" /> LINE
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
