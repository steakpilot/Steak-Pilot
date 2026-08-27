import { Image, ImageStyle, StyleProp } from 'react-native';

interface Props {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function BrandMark({ size = 44, style }: Props) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel="SteakPilot logo"
      resizeMode="contain"
      source={require('../../assets/steakpilot-mark-v2.png')}
      style={[{ height: size, width: size }, style]}
    />
  );
}
