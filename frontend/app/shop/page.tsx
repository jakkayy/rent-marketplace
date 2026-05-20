"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Shop, Product, Rental } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Store, Package, ShoppingBag, Plus, Pencil, Trash2,
  Calendar, CheckCircle, XCircle, Clock, Upload,
} from "lucide-react";

type Tab = "shop" | "products" | "rentals";

const RENTAL_STATUS: Record<string, { label: string; className: string }> = {
  PENDING:   { label: "รอยืนยัน",   className: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "ยืนยันแล้ว", className: "bg-blue-100 text-blue-800" },
  REJECTED:  { label: "ปฏิเสธแล้ว", className: "bg-red-100 text-red-800" },
  ACTIVE:    { label: "กำลังเช่า",  className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "เสร็จสิ้น",  className: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "ยกเลิก",     className: "bg-gray-100 text-gray-500" },
};

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("shop");
  const [shop, setShop] = useState<(Shop & { products: Product[]; rentals: Rental[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "SELLER") { router.push("/"); return; }
    loadShop();
  }, [user, isLoading]);

  async function loadShop() {
    setLoading(true);
    try {
      const data = await api.shops.my();
      setShop(data);
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading || loading) {
    return <div className="py-20 text-center text-muted-foreground">กำลังโหลด...</div>;
  }

  if (!shop) {
    return <CreateShopForm onCreated={(s) => setShop({ ...s, products: [], rentals: [] })} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        {shop.logo ? (
          <img src={shop.logo} className="h-16 w-16 rounded-full object-cover" alt="" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {shop.name[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          <div className="flex items-center gap-2">
            <Badge
              className={
                shop.status === "APPROVED"
                  ? "bg-green-100 text-green-800"
                  : shop.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {shop.status === "APPROVED" ? "อนุมัติแล้ว" : shop.status === "PENDING" ? "รอการอนุมัติ" : "ถูกระงับ"}
            </Badge>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b">
        {([
          { id: "shop", label: "ข้อมูลร้าน", icon: Store },
          { id: "products", label: `สินค้า (${shop.products.length})`, icon: Package },
          { id: "rentals", label: "คำขอเช่า", icon: ShoppingBag },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "shop" && (
        <EditShopForm shop={shop} onUpdated={(s) => setShop({ ...shop, ...s })} />
      )}
      {tab === "products" && (
        <ProductsTab
          shop={shop}
          onRefresh={loadShop}
          onError={setError}
        />
      )}
      {tab === "rentals" && (
        <RentalsTab rentals={shop.rentals} onRefresh={loadShop} onError={setError} />
      )}
    </div>
  );
}

// ─── Create Shop ─────────────────────────────────────────────────────────────

function CreateShopForm({ onCreated }: { onCreated: (shop: Shop) => void }) {
  const [form, setForm] = useState({ name: "", description: "", district: "", phone: "", lineId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const shop = await api.shops.create(form);
      onCreated(shop);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "สร้างร้านค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-6 text-xl font-bold">สร้างร้านค้า</h2>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">ชื่อร้าน *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">คำอธิบายร้าน</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">ย่าน/พื้นที่</label>
              <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="เช่น สยาม, อโศก" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">เบอร์โทร</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">LINE ID</label>
              <Input value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} placeholder="@yourshop" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "กำลังสร้าง..." : "สร้างร้านค้า"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            ร้านค้าจะต้องรอการอนุมัติจาก Admin ก่อนจึงจะแสดงในระบบ
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Edit Shop ────────────────────────────────────────────────────────────────

function EditShopForm({ shop, onUpdated }: { shop: Shop; onUpdated: (s: Partial<Shop>) => void }) {
  const [form, setForm] = useState({
    name: shop.name,
    description: shop.description ?? "",
    district: shop.district ?? "",
    phone: shop.phone ?? "",
    lineId: shop.lineId ?? "",
    instagram: shop.instagram ?? "",
    openingHours: shop.openingHours ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await api.upload(file);
      const updated = await api.shops.update({ logo: url });
      onUpdated({ logo: updated.logo });
      setMsg({ text: "อัปโหลดโลโก้สำเร็จ", ok: true });
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ", ok: false });
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const updated = await api.shops.update(form);
      onUpdated(updated);
      setMsg({ text: "บันทึกสำเร็จ", ok: true });
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ", ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="flex items-center gap-4">
        {shop.logo ? (
          <img src={shop.logo} className="h-16 w-16 rounded-full object-cover" alt="" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Store className="h-6 w-6" />
          </div>
        )}
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <Button type="button" variant="outline" size="sm" disabled={uploadingLogo} onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {uploadingLogo ? "กำลังอัปโหลด..." : "เปลี่ยนโลโก้"}
          </Button>
        </div>
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>
      )}

      {[
        { key: "name", label: "ชื่อร้าน", required: true },
        { key: "description", label: "คำอธิบาย" },
        { key: "district", label: "ย่าน/พื้นที่", placeholder: "เช่น สยาม, อโศก" },
        { key: "phone", label: "เบอร์โทร" },
        { key: "lineId", label: "LINE ID", placeholder: "@yourshop" },
        { key: "instagram", label: "Instagram", placeholder: "yourshop.th" },
        { key: "openingHours", label: "เวลาทำการ", placeholder: "จันทร์-ศุกร์ 10:00-19:00" },
      ].map(({ key, label, required, placeholder }) => (
        <div key={key}>
          <label className="mb-1 block text-sm font-medium">{label}{required && " *"}</label>
          <Input
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            required={required}
          />
        </div>
      ))}

      <Button type="submit" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </form>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({
  shop,
  onRefresh,
  onError,
}: {
  shop: Shop & { products: Product[] };
  onRefresh: () => void;
  onError: (msg: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("ลบสินค้านี้?")) return;
    setDeletingId(id);
    try {
      await api.products.remove(id);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  if (showForm || editProduct) {
    return (
      <ProductForm
        shopId={shop.id}
        product={editProduct ?? undefined}
        onDone={() => { setShowForm(false); setEditProduct(null); onRefresh(); }}
        onCancel={() => { setShowForm(false); setEditProduct(null); }}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> เพิ่มสินค้า
        </Button>
      </div>

      {shop.products.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-2 h-10 w-10 opacity-30" />
          ยังไม่มีสินค้า
        </div>
      ) : (
        <div className="space-y-3">
          {shop.products.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-sm text-primary">฿{Number(p.pricePerDay).toLocaleString()}/วัน</p>
                  <Badge
                    className={`mt-1 text-xs ${
                      p.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.status === "AVAILABLE" ? "ว่าง" : p.status === "RESERVED" ? "ถูกจอง" : p.status === "UNAVAILABLE" ? "ไม่ว่าง" : "เก็บถาวร"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditProduct(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    disabled={deletingId === p.id}
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────

function ProductForm({
  shopId,
  product,
  onDone,
  onCancel,
}: {
  shopId: string;
  product?: Product;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [categories, setCategories] = useState<import("@/lib/types").Category[]>([]);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    pricePerDay: product?.pricePerDay ?? "",
    deposit: product?.deposit ?? "",
    brand: product?.brand ?? "",
    size: product?.size ?? "",
    color: product?.color ?? "",
    occasion: product?.occasion ?? "",
    condition: product?.condition ?? "",
    categoryId: product?.categoryId ?? "",
    status: product?.status ?? ("AVAILABLE" as Product["status"]),
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = files.length === 1
        ? [await api.upload(files[0])]
        : await api.uploadMultiple(files);
      setImages((prev) => [...prev, ...urls]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = {
        ...form,
        images,
        pricePerDay: Number(form.pricePerDay),
        deposit: form.deposit ? Number(form.deposit) : undefined,
      };
      if (product) {
        await api.products.update(product.id, body);
      } else {
        await api.products.create({ ...body, shopId });
      }
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onCancel}>← กลับ</Button>
        <h2 className="font-semibold">{product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {/* Images */}
        <div>
          <label className="mb-2 block text-sm font-medium">รูปภาพ</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((url, i) => (
              <div key={i} className="relative h-20 w-20">
                <img src={url} className="h-full w-full rounded-lg object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary"
            >
              {uploading ? <Clock className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {!uploading && <span className="text-[10px]">เพิ่มรูป</span>}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">ชื่อสินค้า *</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">รายละเอียด</label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">ราคา/วัน (฿) *</label>
            <Input type="number" min="0" value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">มัดจำ (฿)</label>
            <Input type="number" min="0" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">แบรนด์</label>
            <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ไซส์</label>
            <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">สี</label>
            <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">โอกาส</label>
            <Input value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} placeholder="wedding, party…" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">สภาพ</label>
            <Input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">สถานะ</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="AVAILABLE">ว่าง</option>
              <option value="UNAVAILABLE">ไม่ว่าง</option>
              <option value="ARCHIVED">เก็บถาวร</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">หมวดหมู่ *</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          >
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>ยกเลิก</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Rentals Tab ──────────────────────────────────────────────────────────────

function RentalsTab({
  rentals,
  onRefresh,
  onError,
}: {
  rentals: Rental[];
  onRefresh: () => void;
  onError: (msg: string) => void;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      await api.rentals.updateStatus(id, status);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setUpdatingId(null);
    }
  }

  if (rentals.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <ShoppingBag className="mx-auto mb-2 h-10 w-10 opacity-30" />
        ยังไม่มีคำขอเช่า
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rentals.map((rental) => {
        const status = RENTAL_STATUS[rental.status];
        return (
          <Card key={rental.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                    {rental.product?.images?.[0] ? (
                      <img src={rental.product.images[0]} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{rental.product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ลูกค้า: {rental.renter?.firstName} {rental.renter?.lastName}
                      {rental.renter?.phone && ` · ${rental.renter.phone}`}
                    </p>
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
                  <p className="font-bold text-primary">฿{Number(rental.totalPrice).toLocaleString()}</p>

                  {rental.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={updatingId === rental.id}
                        onClick={() => updateStatus(rental.id, "CONFIRMED")}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        ยืนยัน
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={updatingId === rental.id}
                        onClick={() => updateStatus(rental.id, "REJECTED")}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        ปฏิเสธ
                      </Button>
                    </div>
                  )}
                  {rental.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      disabled={updatingId === rental.id}
                      onClick={() => updateStatus(rental.id, "ACTIVE")}
                    >
                      ลูกค้ารับสินค้าแล้ว
                    </Button>
                  )}
                  {rental.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingId === rental.id}
                      onClick={() => updateStatus(rental.id, "COMPLETED")}
                    >
                      คืนสินค้าแล้ว
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
