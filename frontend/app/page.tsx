"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Tag } from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories.list().then(setCategories).catch(console.error);
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await api.products.list({
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(search && { q: search }),
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadProducts();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-primary p-8 text-primary-foreground">
        <h1 className="mb-2 text-3xl font-bold">RentMarket</h1>
        <p className="text-lg opacity-90">เช่าสินค้าได้ง่าย ๆ ไม่ต้องซื้อใหม่</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">ค้นหา</Button>
      </form>

      {/* Categories */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "" ? "default" : "outline"}
          size="sm"
          onClick={() => { setSelectedCategory(""); loadProducts(); }}
        >
          <Tag className="mr-1 h-3 w-3" />
          ทั้งหมด
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => { setSelectedCategory(cat.id); loadProducts(); }}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">กำลังโหลด...</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">ไม่พบสินค้า</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                <div className="aspect-video bg-muted">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      ไม่มีรูป
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary">{product.category?.name}</Badge>
                    <span className="text-sm font-semibold text-primary">
                      ฿{Number(product.pricePerDay).toLocaleString()}/วัน
                    </span>
                  </div>
                  <h3 className="mb-1 font-semibold line-clamp-1">{product.name}</h3>
                  <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                    {product.description || "ไม่มีรายละเอียด"}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="mr-1 h-3 w-3" />
                    {product.shop?.name}
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
