"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Shop } from "@/lib/types";
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
  }, [loadShops]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadShops(search, district);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">ร้านเช่าทั้งหมด</h1>
      <p className="mb-8 text-muted-foreground">เลือกร้านเช่าที่ผ่านการคัดเลือกแล้ว</p>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาร้านค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
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
        <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-muted h-48" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Store className="mx-auto mb-3 h-10 w-10 opacity-20" />
          ไม่พบร้านค้า
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Link key={shop.id} href={`/shops/${shop.id}`}>
              <div className="group overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
                <div className="aspect-video overflow-hidden bg-muted">
                  {shop.banner ? (
                    <img
                      src={shop.banner}
                      alt={shop.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="text-4xl font-bold text-primary/20">{shop.name[0]}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {shop.logo ? (
                      <img src={shop.logo} className="h-10 w-10 flex-shrink-0 rounded-full object-cover border" alt="" />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                        {shop.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{shop.name}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
                    </div>
                  </div>
                  {shop.description && (
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{shop.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
