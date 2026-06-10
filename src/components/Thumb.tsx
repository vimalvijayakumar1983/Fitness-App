import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '@/theme/colors';

interface Props {
  uri: string;
  emoji: string;
  /** Fallback tile gradient. */
  colors?: readonly [string, string];
  size?: number;
  style?: ViewStyle;
}

/** Square rounded thumbnail with an emoji-tile fallback while loading/on error. */
export function Thumb({ uri, emoji, colors: grad, size = 46, style }: Props) {
  const [failed, setFailed] = useState(false);
  const dims = { width: size, height: size, borderRadius: radius.md };

  return (
    <View style={[dims, styles.wrap, style]}>
      <LinearGradient
        colors={(grad ?? ['#E6EBE2', '#D7DDCF']) as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.fallback]}
      >
        <Text style={{ fontSize: size * 0.42 }}>{emoji}</Text>
      </LinearGradient>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={[dims, styles.img]}
          onError={() => setFailed(true)}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  img: { position: 'absolute', top: 0, left: 0 },
});
