import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, Dimensions } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ConfettiRef {
  fire: () => void;
}

const ConfettiCelebration = forwardRef<ConfettiRef>((_, ref) => {
  const confettiRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    fire: () => {
      confettiRef.current?.start();
    },
  }));

  return (
    <ConfettiCannon
      ref={confettiRef}
      count={150}
      origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
      autoStart={false}
      fadeOut={true}
      fallSpeed={3000}
      explosionSpeed={350}
      colors={["#00D26A", "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"]}
    />
  );
});

export default ConfettiCelebration;
