import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-white px-6 py-12 mt-auto">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="mb-4 text-sm font-semibold text-foreground">เลือกสินค้า</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/?occasion=wedding" className="hover:text-primary">งานแต่ง</Link></li>
              <li><Link href="/?occasion=party" className="hover:text-primary">ปาร์ตี้</Link></li>
              <li><Link href="/?occasion=photography" className="hover:text-primary">กล้องถ่ายรูป</Link></li>
              <li><Link href="/?occasion=sports" className="hover:text-primary">อุปกรณ์กีฬา</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold text-foreground">สำหรับร้านค้า</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-primary">สมัครเปิดร้าน</Link></li>
              <li><Link href="/shop" className="hover:text-primary">จัดการร้านค้า</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold text-foreground">ติดต่อ</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shops" className="hover:text-primary">ร้านเช่าทั้งหมด</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} RentMarket — แพลตฟอร์มเช่าสินค้าออนไลน์
        </div>
      </div>
    </footer>
  );
}
