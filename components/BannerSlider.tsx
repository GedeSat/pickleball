// BannerSlider.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type Banner = {
  id: number;
  tag: string;
  title: string;
  titleHighlight: string;
  desc: string;
  image: string;
  bgGradient: string;
};

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch("/api/banners", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        const list = json?.data?.banners;
        if (mounted && Array.isArray(list) && list.length > 0) {
          setBanners(list);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="relative bg-brand text-[#ffffff] overflow-hidden h-[85vh] min-h-[500px]">
      <div
        className="flex w-full h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`w-full h-full flex-shrink-0 relative flex items-center justify-center text-center px-6 bg-gradient-to-r ${banner.bgGradient}`}
          >
            <Image src={banner.image} alt={banner.title} fill priority={banner.id === banners[0]?.id} className="object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient} opacity-65 z-10`}></div>
            <div className="relative z-20 max-w-4xl mx-auto flex flex-col items-center mt-[-5%]">
              <span className="px-4 py-1.5 bg-primary text-[#ffffff] font-bold tracking-wider rounded-full text-xs uppercase mb-6">
                {banner.tag}
              </span>
              <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
                {banner.title} <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                  {banner.titleHighlight}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-[#e2e8f0] max-w-2xl mb-10 leading-relaxed font-medium">
                {banner.desc}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/tournament" className="px-8 py-3 bg-primary text-[#ffffff] font-bold rounded-full hover:bg-primary-hover transition shadow-lg shadow-primary-800/20">
                  Lihat Turnamen
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-30">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              currentSlide === index ? `w-10 bg-primary` : "w-2.5 bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.7)]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}