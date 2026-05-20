"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Store, ShoppingBag } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-primary">
          RentMarket
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/shops">
            <Button variant="ghost" size="sm">
              <Store className="h-4 w-4 mr-1" />
              ร้านค้า
            </Button>
          </Link>

          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.firstName} {user.lastName}
              </span>
              <Link href="/rentals">
                <Button variant="ghost" size="sm">
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  รายการเช่า
                </Button>
              </Link>
              {user.role === "SELLER" && (
                <Link href="/shop">
                  <Button variant="ghost" size="sm">
                    <Store className="h-4 w-4 mr-1" />
                    ร้านค้า
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" />
                ออกจากระบบ
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
