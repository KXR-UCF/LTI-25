"use client";

import { useState } from "react";

import LiquidUI from "./components/LiquidUI";
import SolidUI from "./components/SolidUI";

export default function Home() {

  const [solid, setSolid] = useState(true)

  const switchUI = () => {
    setSolid(!solid)
  }

  return (
    <>
      <button onClick = { switchUI }>Switch UI</button>
      {solid? <SolidUI/>: <LiquidUI/>}
    </>
  )
}