import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color: string;
  /** Gradient fill under the line. */
  fillColors?: readonly [string, string];
}

/** Lightweight area + line sparkline for trend cards. */
export function Sparkline({
  data,
  width = 280,
  height = 64,
  color,
  fillColors,
}: Props) {
  if (data.length < 2) {
    return <View style={{ width, height }} />;
  }
  const pad = 4;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`;
  const gradId = `spark-${Math.random().toString(36).slice(2)}`;

  return (
    <Svg width={width} height={height}>
      {fillColors ? (
        <>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={fillColors[0]} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={fillColors[1]} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${gradId})`} />
        </>
      ) : null}
      <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
