"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Product, Category, Shop } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Check, ArrowRight, Search } from "lucide-react";

const OCCASIONS = [
  { label: "ทั้งหมด", value: "" },
  { label: "งานหมั้น", value: "engagement" },
  { label: "งานแต่ง", value: "wedding" },
  { label: "ค็อกเทล", value: "cocktail" },
  { label: "ราตรี", value: "evening" },
  { label: "กาล่า", value: "gala" },
  { label: "ปาร์ตี้", value: "party" },
  { label: "ทำงาน", value: "work" },
  { label: "ลำลอง", value: "casual" },
  { label: "กล้อง", value: "photography" },
  { label: "กีฬา", value: "sports" },
];

const FEATURES = [
  "คัดเลือกร้านเช่าที่น่าเชื่อถือ",
  "ตรวจสอบสินค้าก่อนส่งมอบ",
  "ไม่มีค่าธรรมเนียมเพิ่มเติม",
  "ติดต่อร้านโดยตรงผ่าน LINE",
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async (occasion: string, categoryId: string, q: string) => {
    setLoading(true);
    try {
      const res = await api.products.list({
        ...(occasion && { occasion }),
        ...(categoryId && { categoryId }),
        ...(q && { q }),
        limit: 8,
      });
      setProducts(res.data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
    api.shops.list({ limit: 4 }).then((res) => setFeaturedShops(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts(selectedOccasion, selectedCategory, search);
  }, [selectedOccasion, selectedCategory, loadProducts]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-white px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              เช่าสินค้าจาก<br />
              <span className="text-primary">ร้านที่ไว้ใจได้</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              แคตตาล็อกสินค้าเช่าจากร้านในไทย ติดต่อร้านผ่าน LINE โดยตรง
            </p>

            <div className="mb-8 flex flex-wrap gap-3">
              <Link href="#products">
                <Button size="lg" className="gap-2">
                  เริ่มเลือกสินค้า
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/shops">
                <Button size="lg" variant="outline">
                  ดูร้านเช่าทั้งหมด
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              {FEATURES.map((f) => (
                <span key={f} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Browse */}
      <section id="products" className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); loadProducts(selectedOccasion, selectedCategory, search); }}
            className="mb-6 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">ค้นหา</Button>
          </form>

          {/* Occasion filter */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {OCCASIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setSelectedOccasion(o.value)}
                className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedOccasion === o.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("")}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                selectedCategory === ""
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              ทุกหมวด
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  selectedCategory === cat.id
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">สินค้าทั้งหมด</h2>
            <Link href="/" className="text-sm text-primary hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-muted aspect-[3/4]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">ไม่พบสินค้า</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Shops */}
      {featuredShops.length > 0 && (
        <section className="border-t bg-muted/40 px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">ร้านเช่าแนะนำ</h2>
              <Link href="/shops" className="text-sm text-primary hover:underline">
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="group overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              ไม่มีรูป
            </div>
          )}
          {product.category && (
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
              {product.category.name}
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="mb-0.5 line-clamp-1 text-sm font-medium">{product.name}</p>
          {product.shop?.name && (
            <p className="mb-1 text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {product.shop.name}
            </p>
          )}
          <p className="text-sm font-semibold text-primary">
            ฿{Number(product.pricePerDay).toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground"> / วัน</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link href={`/shops/${shop.id}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-video bg-muted overflow-hidden">
          {shop.banner ? (
            <img src={shop.banner} alt={shop.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-3xl font-bold text-primary/20">{shop.name[0]}</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {shop.logo ? (
              <img src={shop.logo} className="h-8 w-8 rounded-full object-cover border" alt="" />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {shop.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate text-sm">{shop.name}</p>
              {shop.district && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {shop.district}
                </p>
              )}
            </div>
          </div>
          {shop.description && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{shop.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
