"use client"
import Hero from "@/components/home/hero"
import LandingPage from "@/components/home/landing-page"

export default function Page() {

  return (
      <>
      <Hero/>
      <div className="relative z-20 -mt-2">
        <LandingPage/>
      </div>
      </>
  )
}
