import HeroPage from "@/components/layout/HeroPage";
import SecondPage from "@/components/layout/SecondPage";
import ThirdPage from "@/components/layout/ThirdPage";
import FourthPage from "@/components/layout/FourthPage";
import VideoPage from "@/components/layout/VideoPage";

export default function Home() {
  return (
    <main className=" min-h-dvh">
      <HeroPage />
      <div className="md:block hidden">
        <VideoPage />
        <SecondPage />
      </div>
      <ThirdPage />
      <FourthPage />
    </main>
  );
}
