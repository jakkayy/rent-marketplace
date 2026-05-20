"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag, LogOut } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo + Nav links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
            RentMarket
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              เลือกสินค้า
            </Link>
            <Link href="/shops" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ร้านเช่า
            </Link>
          </div>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:block">
                {user.firstName}
              </span>
              <Link href="/rentals">
                <Button variant="ghost" size="sm">
                  <ShoppingBag className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">รายการเช่า</span>
                </Button>
              </Link>
              {user.role === "SELLER" && (
                <Link href="/shop">
                  <Button variant="ghost" size="sm">
                    <Store className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">จัดการร้าน</span>
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">ออก</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">เข้าสู่ระบบ</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">สมัครสมาชิก</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
