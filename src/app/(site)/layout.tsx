import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1920px] flex-1 px-4 py-10 sm:px-8 lg:px-12">{children}</main>
      <SiteFooter />
    </>
  );
}
