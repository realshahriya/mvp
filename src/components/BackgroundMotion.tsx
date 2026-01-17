'use client'
import { useEffect } from 'react'

export function BackgroundMotion() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.fixed-background')
    if (!el) return
    let x = 50
    let y = 50
    let r = 210
    let tx = 50
    let ty = 50
    let tr = 210
    let raf = 0
    const setVars = () => {
      el.style.setProperty('--spot-x', `${x}%`)
      el.style.setProperty('--spot-y', `${y}%`)
      el.style.setProperty('--spot-r', `${r}px`)
    }
    const pickTarget = () => {
      tx = 10 + Math.random() * 80
      ty = 10 + Math.random() * 80
      tr = 170 + Math.random() * 120
      if (Math.random() < 0.25) {
        el.style.setProperty('--eyes-opacity', '1')
        el.style.setProperty('--eyes-sep', '34px')
        el.style.setProperty('--eye-size', '16px')
        setTimeout(() => {
          el.style.setProperty('--eyes-opacity', '0')
        }, 2500)
      }
    }
    const step = () => {
      x += (tx - x) * 0.02
      y += (ty - y) * 0.02
      r += (tr - r) * 0.02
      setVars()
      raf = requestAnimationFrame(step)
    }
    pickTarget()
    setVars()
    raf = requestAnimationFrame(step)
    const interval = setInterval(pickTarget, 4000 + Math.random() * 4000)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(interval)
    }
  }, [])
  return null
}
