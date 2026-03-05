import { FC, useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

interface Position {
  x: number;
  y: number;
}

export interface SmoothCursorProps {
  cursor?: React.ReactNode;
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
    restDelta: number;
  };
}

const DefaultCursorSVG: FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={22}
      viewBox="0 0 50 54"
      fill="none"
    >
      <g filter="url(#filter0_d_91_7928)">
        <path
          d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
          fill="black"
        />
        <path
          d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
          stroke="white"
          strokeWidth={2.25825}
        />
      </g>
      <defs>
        <filter
          id="filter0_d_91_7928"
          x={0.602397}
          y={0.952444}
          width={49.0584}
          height={52.428}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={2.25825} />
          <feGaussianBlur stdDeviation={2.25825} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_91_7928"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_91_7928"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
};

// --- New Text Cursor (|) ---
const TextCursorSVG: FC = () => (
  <svg width="12" height="24" viewBox="0 0 12 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M6 2V22M3 2H9M3 22H9" 
      stroke="white" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.8))" }}
    />
  </svg>
);

// --- New Pointer Cursor (Thumb/Hand) ---
const PointerCursorSVG: FC = () => (
  <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translateY(15%)' }}>
    <path 
      d="M10 12V4C10 2.89543 10.8954 2 12 2C13.1046 2 14 2.89543 14 4V12M14 12V11C14 9.89543 14.8954 9 16 9C17.1046 9 18 9.89543 18 11V12M18 12V11C18 9.89543 18.8954 9 20 9C21.1046 9 22 9.89543 22 11V16C22 19.3137 19.3137 22 16 22H13.5C11.7761 22 10.1228 21.3158 8.90524 20.0982L6 17.193V15C6 13.8954 6.89543 13 8 13C8.53043 13 9.03914 13.2107 9.41421 13.5858L10 14.1716V12" 
      fill="black" 
      stroke="white" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ filter: "drop-shadow(0px 3px 3px rgba(0,0,0,0.4))" }}
    />
  </svg>
);

type CursorType = "default" | "text" | "pointer";

const CustomCursor = ({
  cursor = <DefaultCursorSVG />,
  springConfig = {
    damping: 30,
    stiffness: 1200,
    mass: 0.1,
    restDelta: 0.001,
  },
}: SmoothCursorProps) => {
  const [isMoving, setIsMoving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cursorType, setCursorType] = useState<CursorType>("default"); // State for cursor variants

  const lastMousePos = useRef<Position>({ x: 0, y: 0 });
  const velocity = useRef<Position>({ x: 0, y: 0 });
  const lastUpdateTime = useRef(Date.now());
  const previousAngle = useRef(0);
  const accumulatedRotation = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);
  
  const rotation = useSpring(0, {
    damping: 40,
    stiffness: 400,
    mass: 0.5,
  });
  const scale = useSpring(1, {
    damping: 30,
    stiffness: 600,
    mass: 0.1,
  });

  useEffect(() => {
    const checkDevice = () => {
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    
    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const updateVelocity = (currentPos: Position) => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime.current;

      if (deltaTime > 0) {
        velocity.current = {
          x: (currentPos.x - lastMousePos.current.x) / deltaTime,
          y: (currentPos.y - lastMousePos.current.y) / deltaTime,
        };
      }

      lastUpdateTime.current = currentTime;
      lastMousePos.current = currentPos;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = { x: e.clientX, y: e.clientY };
      updateVelocity(currentPos);

      // Element detection for cursor type
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable="true"]')) {
        setCursorType("text");
      } else if (target.closest('a, button, [role="button"], label, select, option')) {
        setCursorType("pointer");
      } else {
        setCursorType("default");
      }

      const speed = Math.sqrt(
        Math.pow(velocity.current.x, 2) + Math.pow(velocity.current.y, 2)
      );

      cursorX.set(currentPos.x);
      cursorY.set(currentPos.y);

      if (speed > 0.1) {
        const currentAngle =
          Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI) +
          90;

        let angleDiff = currentAngle - previousAngle.current;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        accumulatedRotation.current += angleDiff;
        
        rotation.set(accumulatedRotation.current);
        previousAngle.current = currentAngle;

        scale.set(0.95);
        setIsMoving(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
          scale.set(1);
          setIsMoving(false);
        }, 150);
      }
    };

    document.body.style.cursor = "none";
    
    const style = document.createElement('style');
    style.innerHTML = '* { cursor: none !important; }';
    style.id = 'cursor-style';
    document.head.appendChild(style);

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      
      document.body.style.cursor = "auto";
      const styleEl = document.getElementById('cursor-style');
      if (styleEl) styleEl.remove();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [cursorX, cursorY, rotation, scale, isMobile]);

  if (isMobile) return null;

  return (
    <motion.div
      style={{
        position: "fixed",
        left: cursorX,
        top: cursorY,
        x: "-50%",
        y: "-50%",
        // Only rotate if it is the default cursor arrow. Hands and Text beams should stay upright.
        rotate: cursorType === "default" ? rotation : 0, 
        scale: scale,
        zIndex: 9999,
        pointerEvents: "none",
        willChange: "transform",
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
    >
      {cursorType === "text" ? <TextCursorSVG /> : cursorType === "pointer" ? <PointerCursorSVG /> : cursor}
    </motion.div>
  );
};

export default CustomCursor;