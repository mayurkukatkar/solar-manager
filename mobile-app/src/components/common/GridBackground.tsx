import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface GridBackgroundProps {
  gridSize?: number;
  isDark?: boolean;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  gridSize = 32,
  isDark = false,
}) => {
  const { width, height } = useWindowDimensions();

  const pathData = useMemo(() => {
    let d = '';
    const cols = Math.ceil(width / gridSize);
    const rows = Math.ceil(height / gridSize);

    // Vertical lines
    for (let i = 0; i <= cols; i++) {
      const x = i * gridSize;
      d += `M ${x} 0 L ${x} ${height} `;
    }

    // Horizontal lines
    for (let j = 0; j <= rows; j++) {
      const y = j * gridSize;
      d += `M 0 ${y} L ${width} ${y} `;
    }

    return d;
  }, [width, height, gridSize]);

  const strokeColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)';

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Path d={pathData} stroke={strokeColor} strokeWidth={1} fill="none" />
    </Svg>
  );
};

export default GridBackground;
