import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNavigation from "./MobileBottomNavigation";
import { useMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useMobile();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-20 md:pb-12 flex-grow">
        {children}
      </main>
      <Footer className={isMobile ? "pb-16" : ""} />
      {isMobile && <MobileBottomNavigation />}
    </div>
  );
};

export default MainLayout;
