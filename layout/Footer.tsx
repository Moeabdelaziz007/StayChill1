import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube, Airplay, ChevronDown } from "lucide-react";
import { useState } from "react";

// Footer Section Component with collapsible functionality for mobile
const FooterSection = ({ 
  title, 
  links 
}: { 
  title: string; 
  links: { href: string; label: string }[] 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-700 py-3 md:border-none md:py-0">
      <div
        className="flex items-center justify-between cursor-pointer md:cursor-default"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <ChevronDown 
          className={`h-5 w-5 transition-transform md:hidden ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>
      <ul className={`mt-2 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
      }`}>
        {links.map((link, idx) => (
          <li key={idx}>
            <Link href={link.href}>
              <div className="text-gray-300 hover:text-white cursor-pointer py-1">{link.label}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface FooterProps {
  className?: string;
}

const Footer = ({ className = "" }: FooterProps) => {
  const sections = [
    {
      title: "StayChill",
      links: [
        { href: "/", label: "About Us" },
        { href: "/", label: "Careers" },
        { href: "/", label: "Press" },
        { href: "/", label: "Policies" },
        { href: "/", label: "Help Center" }
      ]
    },
    {
      title: "Destinations",
      links: [
        { href: "/search?location=Ras El Hekma", label: "Ras El Hekma" },
        { href: "/search?location=Sharm El Sheikh", label: "Sharm El Sheikh" },
        { href: "/search?location=El Sahel", label: "El Sahel" },
        { href: "/search?location=Marina", label: "Marina" },
        { href: "/search?location=Marsa Matrouh", label: "Marsa Matrouh" }
      ]
    },
    {
      title: "Host",
      links: [
        { href: "/", label: "Become a Host" },
        { href: "/", label: "Host Resources" },
        { href: "/", label: "Community Forum" },
        { href: "/", label: "Property Management" },
        { href: "/", label: "Responsible Hosting" }
      ]
    },
    {
      title: "Support",
      links: [
        { href: "/", label: "Help Center" },
        { href: "/", label: "Safety Information" },
        { href: "/", label: "Cancellation Options" },
        { href: "/", label: "Contact Us" }
      ]
    }
  ];

  return (
    <footer className={`bg-gray-800 text-white pt-8 pb-6 border-t border-gray-700 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-8">
          {sections.map((section, idx) => (
            <FooterSection 
              key={idx} 
              title={section.title} 
              links={section.links} 
            />
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col items-center md:flex-row md:justify-between">
            <div className="mb-4 md:mb-0">
              <span className="text-xl font-bold text-white">StayChill</span>
            </div>
            <div className="flex space-x-6 mb-6 md:mb-0">
              {[
                { Icon: Facebook, href: "/" },
                { Icon: Twitter, href: "/" },
                { Icon: Instagram, href: "/" },
                { Icon: Youtube, href: "/" },
                { Icon: Airplay, href: "/" }
              ].map(({ Icon, href }, idx) => (
                <Link key={idx} href={href}>
                  <div className="text-gray-300 hover:text-white cursor-pointer">
                    <Icon className="h-5 w-5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} StayChill, Inc. All rights reserved.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {[
                { href: "/", label: "Privacy" },
                { href: "/", label: "Terms" },
                { href: "/", label: "Sitemap" },
                { href: "/", label: "Destinations" }
              ].map((link, idx) => (
                <Link key={idx} href={link.href}>
                  <div className="text-gray-300 hover:text-white cursor-pointer">{link.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
