"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";

function isTransparent(color: string) {
  return (
    !color ||
    color === "transparent" ||
    color === "rgba(0, 0, 0, 0)" ||
    color === "rgb(0 0 0 / 0)"
  );
}

function shouldUseLightHeader(color: string) {
  const rgb = color.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/,
  );

  if (rgb) {
    const [, red, green, blue, alpha = "1"] = rgb;
    const opacity = alpha.endsWith("%")
      ? Number(alpha.slice(0, -1)) / 100
      : Number(alpha);

    if (opacity < 0.2) {
      return false;
    }

    const brightness =
      (Number(red) * 299 + Number(green) * 587 + Number(blue) * 114) / 1000;

    return brightness < 200;
  }

  const oklch = color.match(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/,
  );

  if (oklch) {
    const [, lightness, chroma, , alpha = "1"] = oklch;
    const opacity = alpha.endsWith("%")
      ? Number(alpha.slice(0, -1)) / 100
      : Number(alpha);
    const lightnessValue = lightness.endsWith("%")
      ? Number(lightness.slice(0, -1)) / 100
      : Number(lightness);

    if (opacity < 0.2) {
      return false;
    }

    return lightnessValue < 0.82 || Number(chroma) > 0.04;
  }

  return false;
}

export default function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollYRef = useRef(0);
  const [showHeader, setShowHeader] = useState(true);
  const [useLightHeader, setUseLightHeader] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const useDarkHeader = pathname === "/reservation" || pathname === "/login";

  useEffect(() => {
    const updateHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      setIsAtTop(currentScrollY <= 4);

      if (currentScrollY <= 4) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollYRef.current) {
        setShowHeader(true);
      } else if (currentScrollY < lastScrollYRef.current) {
        setShowHeader(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    updateHeaderVisibility();
    window.addEventListener("scroll", updateHeaderVisibility, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateHeaderVisibility);
    };
  }, []);

  useEffect(() => {
    const updateHeaderColor = () => {
      const header = headerRef.current;

      if (useDarkHeader) {
        setUseLightHeader(false);
        return;
      }

      if (!header) {
        return;
      }

      const bounds = header.getBoundingClientRect();

      if (window.scrollY < window.innerHeight - bounds.height) {
        setUseLightHeader(true);
        return;
      }

      const previousPointerEvents = header.style.pointerEvents;
      header.style.pointerEvents = "none";

      const target = document.elementFromPoint(
        window.innerWidth / 2,
        Math.max(1, bounds.top + bounds.height / 2),
      );

      header.style.pointerEvents = previousPointerEvents;

      let element = target;

      while (element && element !== document.documentElement) {
        if (
          element instanceof HTMLImageElement ||
          element instanceof HTMLVideoElement ||
          element instanceof HTMLCanvasElement
        ) {
          setUseLightHeader(true);
          return;
        }

        const backgroundColor =
          window.getComputedStyle(element).backgroundColor;

        if (!isTransparent(backgroundColor)) {
          setUseLightHeader(shouldUseLightHeader(backgroundColor));
          return;
        }

        element = element.parentElement;
      }

      setUseLightHeader(false);
    };

    updateHeaderColor();
    window.addEventListener("scroll", updateHeaderColor, { passive: true });
    window.addEventListener("resize", updateHeaderColor);

    return () => {
      window.removeEventListener("scroll", updateHeaderColor);
      window.removeEventListener("resize", updateHeaderColor);
    };
  }, [useDarkHeader]);

  const headerTextColor = useLightHeader
    ? "text-accent"
    : "text-accent-foreground";
  const resolvedHeaderTextColor = useDarkHeader
    ? "text-brown"
    : isAtTop
      ? "text-accent"
      : headerTextColor;
  const separatorColor = useLightHeader
    ? "border-accent"
    : "border-accent-foreground";
  const resolvedSeparatorColor = useDarkHeader
    ? "border-brown"
    : isAtTop
      ? "border-accent"
      : separatorColor;
  const separatorBackground = useLightHeader
    ? "bg-accent/30"
    : "bg-accent-foreground/30";
  const resolvedSeparatorBackground = useDarkHeader
    ? "bg-brown/30"
    : isAtTop
      ? "bg-accent-foreground/30"
      : separatorBackground;
  const logoSrc =
    useDarkHeader || (!isAtTop && !useLightHeader)
      ? "/logo/logo.png"
      : "/logo/logo-white.png";
  const headerBackgroundClass = isAtTop
    ? "bg-accent/10 shadow-lg backdrop-blur-sm"
    : "bg-accent/10 shadow-lg backdrop-blur-sm";

  return (
    <header
      ref={headerRef}
      className={`
        fixed top-0 z-50
        flex h-[10dvh] w-full items-center justify-center
        ${headerBackgroundClass}
        transform transition-transform duration-300 ease-out
        ${showHeader ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      <nav className="mx-auto w-full max-w-[90dvw] rounded-2xl px-0 py-3 md:px-6 md:py-4">
        <ul
          className={`flex flex-row ${resolvedHeaderTextColor} items-center justify-between uppercase transition-colors duration-300`}
        >
          {/* Menu */}
          <li className="flex items-center md:gap-4 gap-2">
            <Drawer direction="bottom">
              <DrawerTrigger asChild>
                <Button
                  className={`bg-accent/5 md:p-4 border-none rounded-none cursor-pointer uppercase text-sm md:text-lg font-thin ${resolvedHeaderTextColor}`}
                >
                  <div className="w-8 md:w-10 flex flex-col gap-2">
                    <Separator className={`border ${resolvedSeparatorColor}`} />
                    <Separator className={`border ${resolvedSeparatorColor}`} />
                  </div>
                  <h1>Menu</h1>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="rounded-t-2xl border-brown/20 bg-cream">
                <DrawerHeader className="px-5 pt-4 text-left">
                  <DrawerTitle className="font-googlesansflex text-xl text-brown">
                    Quick Actions
                  </DrawerTitle>
                  <DrawerDescription className="font-googlesansflex text-brown/75">
                    Choose where you want to go.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-3 px-5 pb-6">
                  <a
                    href="/home"
                    className="rounded-lg border border-brown/20 bg-white px-4 py-3 text-center font-googlesansflex text-base font-semibold text-brown transition-colors hover:bg-sand/40"
                  >
                    Homepage
                  </a>
                  <a
                    href="/reservation"
                    className="rounded-lg border border-brown/20 bg-accent px-4 py-3 text-center font-googlesansflex text-base font-semibold text-brown transition-colors hover:bg-khaki/40"
                  >
                    Make a Reservation
                  </a>
                  <a
                    href="/login"
                    className="rounded-lg border border-brown/20 bg-brown px-4 py-3 text-center font-googlesansflex text-base font-semibold text-cream transition-colors hover:bg-brown/90"
                  >
                    Login to Admin
                  </a>
                </div>
              </DrawerContent>
            </Drawer>
          </li>

          {/* Logo */}
          <li>
            <a href="/home">
              <Image
                src={logoSrc}
                alt="Logo"
                width={180}
                height={72}
                className="h-7 w-auto md:h-8"
                priority
              />
            </a>
          </li>

          {/* Desktop only */}
          <li className="hidden md:flex items-center gap-4 justify-center text-lg bg-accent/5 px-4">
            {/* <a
              href="/contact"
              className="relative inline-block after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full"
            >
              Apply
            </a>

            <Separator
              orientation="vertical"
              className={`h-5 ${resolvedSeparatorBackground}`}
            /> */}

            <a
              href="/login"
              className="relative inline-block after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full"
            >
              Login
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
