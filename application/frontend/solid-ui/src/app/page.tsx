"use client";

import SolidUI from "./components/SolidUI";

export default function Home() {

  const switchUI = () => {
    console.log("Working")
  }

  return (
    <>
      <button onClick = {switchUI}>Yo</button>
      <SolidUI/>
    </>
  )
}
