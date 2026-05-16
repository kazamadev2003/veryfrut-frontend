"use client"

import Footer from "@/components/home/footer"
import Header from "@/components/home/header"
import Loading from "@/components/loading"
import { SmoothScroll } from "@/components/smooth-scroll"
import type { ReactNode } from "react"
interface HomeLayoutProps {
  children: ReactNode
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
   
    <>
    <Loading/>
    <SmoothScroll/>
    <Header/>
    {children}
    <Footer/>
    </>
  )
}