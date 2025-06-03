import { useState, useEffect } from "react";
import { Grid } from "antd";

const { useBreakpoint: useAntBreakpoint } = Grid;

export function useBreakpoint() {
  const screens = useAntBreakpoint();
  return screens;
}

export function useResponsive() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    ...dimensions,
    isMobile: dimensions.width < 768,
    isTablet: dimensions.width >= 768 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
  };
}
