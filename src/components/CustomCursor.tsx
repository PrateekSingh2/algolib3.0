import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // We use two different springs for a "trailing" effect
  // 1. The Dot (Fast & Precise)
  const dotSpringConfig = { damping: 25, stiffness: 700 };
  
  // 2. The Ring (Smooth & Flowy)
  const ringSpringConfig = { damping: 20, stiffness: 300, mass: 0.5 };

  const dotX = useSpring(cursorX, dotSpringConfig);
  const dotY = useSpring(cursorY, dotSpringConfig);
  const ringX = useSpring(cursorX, ringSpringConfig);
  const ringY = useSpring(cursorY, ringSpringConfig);

  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    // Check if hovering over clickable elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.tagName === "INPUT" ||
        target.style.cursor === "pointer"
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 border border-[#00f5ff] rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%", // Center the div on the cursor
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? 48 : 32, // Expands on hover
          height: isHovering ? 48 : 32,
          scale: isClicking ? 0.8 : 1, // Shrinks on click
          opacity: isHovering ? 0.8 : 0.5,
          borderColor: isClicking ? "#9d00ff" : "#00f5ff"
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      />

      {/* Center Dot */}
      <motion.div 
        className="fixed top-0 left-0 bg-[#00f5ff] rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? 8 : 4,
          height: isHovering ? 8 : 4,
          backgroundColor: isClicking ? "#9d00ff" : "#00f5ff"
        }}
      />
    </>
  );
};

export default CustomCursor;