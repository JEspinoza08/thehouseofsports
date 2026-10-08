import { useEffect, useRef, useState } from "react";
import arqueroCarrito from "../assets/arquerocarrito.webp";

const ANIMATION_MS = 1550;

export default function GoalkeeperCartAnimation() {
  const [runId, setRunId] = useState(0);
  const [visible, setVisible] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const keeperRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onAdd = () => {
      setRunId((id) => id + 1);
      setVisible(true);
    };

    window.addEventListener("cart:add-animation", onAdd);
    return () => window.removeEventListener("cart:add-animation", onAdd);
  }, []);

  useEffect(() => {
    if (!visible || !stageRef.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cart = document.querySelector<HTMLElement>("[data-cart-target]");
    const cartRect = cart?.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const targetX = cartRect ? cartRect.left + cartRect.width / 2 : vw - 44;
    const targetY = cartRect ? cartRect.top + cartRect.height / 2 : 56;

    if (reduceMotion) {
      cart?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.16)" },
          { transform: "scale(1)" },
        ],
        { duration: 360, easing: "ease-out" },
      );
      const t = window.setTimeout(() => setVisible(false), 420);
      return () => window.clearTimeout(t);
    }

    const keeper = keeperRef.current;
    const ball = ballRef.current;
    const flash = flashRef.current;
    const label = labelRef.current;
    const animations: Animation[] = [];

    if (keeper) {
      animations.push(
        keeper.animate(
          [
            { opacity: 0, transform: "translate3d(-70px, 42px, 0) rotate(7deg) scale(.72)" },
            { opacity: 1, transform: "translate3d(4px, 0, 0) rotate(-4deg) scale(1)", offset: 0.25 },
            { opacity: 1, transform: "translate3d(46px, -28px, 0) rotate(-12deg) scale(1.04)", offset: 0.52 },
            { opacity: 1, transform: "translate3d(52px, -30px, 0) rotate(-12deg) scale(1.04)", offset: 0.7 },
            { opacity: 0, transform: "translate3d(88px, -18px, 0) rotate(-8deg) scale(.93)" },
          ],
          { duration: ANIMATION_MS, easing: "cubic-bezier(.2,.75,.2,1)", fill: "forwards" },
        ),
      );
    }

    if (ball) {
      const startX = Math.max(26, vw * 0.17);
      const startY = Math.min(vh - 170, vh * 0.63);
      const saveX = Math.min(vw * 0.52, startX + 270);
      const saveY = Math.max(125, startY - 120);

      ball.style.left = `${startX}px`;
      ball.style.top = `${startY}px`;
      animations.push(
        ball.animate(
          [
            { opacity: 0, transform: "translate3d(-90px, 48px, 0) rotate(-80deg) scale(.72)" },
            { opacity: 1, transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)", offset: 0.12 },
            {
              opacity: 1,
              transform: `translate3d(${saveX - startX}px, ${saveY - startY}px, 0) rotate(540deg) scale(1.08)`,
              offset: 0.46,
            },
            {
              opacity: 1,
              transform: `translate3d(${saveX - startX + 5}px, ${saveY - startY + 2}px, 0) rotate(560deg) scale(.9)`,
              offset: 0.57,
            },
            {
              opacity: 1,
              transform: `translate3d(${targetX - startX}px, ${targetY - startY}px, 0) rotate(1080deg) scale(.28)`,
              offset: 0.9,
            },
            {
              opacity: 0,
              transform: `translate3d(${targetX - startX}px, ${targetY - startY}px, 0) rotate(1120deg) scale(.18)`,
            },
          ],
          { duration: ANIMATION_MS, easing: "cubic-bezier(.18,.72,.2,1)", fill: "forwards" },
        ),
      );
    }

    if (flash) {
      animations.push(
        flash.animate(
          [
            { opacity: 0, transform: "scale(.35)" },
            { opacity: 0, transform: "scale(.35)", offset: 0.4 },
            { opacity: 0.95, transform: "scale(1.2)", offset: 0.52 },
            { opacity: 0, transform: "scale(2.2)" },
          ],
          { duration: 980, easing: "ease-out", fill: "forwards" },
        ),
      );
    }

    if (label) {
      animations.push(
        label.animate(
          [
            { opacity: 0, transform: "translateY(12px) scale(.88)" },
            { opacity: 0, transform: "translateY(12px) scale(.88)", offset: 0.4 },
            { opacity: 1, transform: "translateY(0) scale(1.05)", offset: 0.55 },
            { opacity: 1, transform: "translateY(0) scale(1)", offset: 0.82 },
            { opacity: 0, transform: "translateY(-8px) scale(.98)" },
          ],
          { duration: 1250, easing: "ease-out", fill: "forwards" },
        ),
      );
    }

    const cartTimer = window.setTimeout(() => {
      cart?.animate(
        [
          { transform: "scale(1) rotate(0deg)" },
          { transform: "scale(1.23) rotate(-6deg)" },
          { transform: "scale(.96) rotate(4deg)" },
          { transform: "scale(1) rotate(0deg)" },
        ],
        { duration: 430, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    }, 1260);

    const hideTimer = window.setTimeout(() => setVisible(false), ANIMATION_MS + 120);

    return () => {
      window.clearTimeout(cartTimer);
      window.clearTimeout(hideTimer);
      animations.forEach((animation) => animation.cancel());
    };
  }, [visible, runId]);

  if (!visible) return null;

  return (
    <div ref={stageRef} className="ths-save-stage" aria-hidden="true">
      <div className="ths-save-speed-lines" />

      <div ref={keeperRef} className="ths-save-keeper">
        <img
    src={arqueroCarrito}
    alt=""
    className="h-full w-full object-contain"
    draggable={false}
  />
      </div>

      <div ref={flashRef} className="ths-save-flash" />

      <div ref={ballRef} className="ths-save-ball">
        <svg viewBox="0 0 64 64" role="presentation">
          <circle cx="32" cy="32" r="29" fill="#f7f7f7" stroke="#111" strokeWidth="3" />
          <path d="M32 17 42 24 38 36 26 36 22 24Z" fill="#111" />
          <path d="m22 24-12-3M42 24l12-3M38 36l7 12M26 36l-7 12M32 17l1-11" stroke="#111" strokeWidth="3" />
        </svg>
      </div>

      <div ref={labelRef} className="ths-save-label">
        <strong>¡ATAJADO!</strong>
        <span>AL CARRITO</span>
      </div>
    </div>
  );
}
