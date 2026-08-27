import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

export type CookGuideVisualKind =
  | 'thickness'
  | 'dry'
  | 'fatCap'
  | 'oil'
  | 'butter'
  | 'thermometer';

interface Props {
  kind: CookGuideVisualKind;
  height?: number;
}

const stroke = colors.text;
const accent = colors.orange;
const muted = colors.muted;

export function CookGuideVisual({ kind, height = 76 }: Props) {
  return (
    <Svg accessibilityLabel={`${kind} cooking guide diagram`} height={height} viewBox="0 0 160 90" width="100%">
      {kind === 'thickness' ? <Thickness /> : null}
      {kind === 'dry' ? <Dry /> : null}
      {kind === 'fatCap' ? <FatCap /> : null}
      {kind === 'oil' ? <Oil /> : null}
      {kind === 'butter' ? <Butter /> : null}
      {kind === 'thermometer' ? <Thermometer /> : null}
    </Svg>
  );
}

function Steak({ x = 31, y = 32, width = 98, height = 35 }: { x?: number; y?: number; width?: number; height?: number }) {
  return <Rect fill="#5A2418" height={height} rx={height / 2} stroke={accent} strokeWidth="3" width={width} x={x} y={y} />;
}

function Thickness() {
  return (
    <>
      <Steak y={31} height={38} />
      <Line stroke={stroke} strokeWidth="2" x1="20" x2="20" y1="31" y2="69" />
      <Line stroke={stroke} strokeWidth="2" x1="14" x2="26" y1="31" y2="31" />
      <Line stroke={stroke} strokeWidth="2" x1="14" x2="26" y1="69" y2="69" />
      <Path d="M16 38 L20 31 L24 38 M16 62 L20 69 L24 62" fill="none" stroke={accent} strokeWidth="2" />
      <Line stroke={muted} strokeDasharray="4 4" strokeWidth="1.5" x1="80" x2="80" y1="23" y2="76" />
    </>
  );
}

function Dry() {
  return (
    <>
      <Steak y={40} height={31} />
      <Path d="M42 28 C42 19 50 17 50 10 C58 19 58 24 54 28 C51 31 45 31 42 28Z" fill="#6EC5FF" />
      <Path d="M65 31 C65 24 72 22 72 16 C79 23 79 28 76 31 C73 34 68 34 65 31Z" fill="#6EC5FF" />
      <Path d="M93 15 L132 27 L124 43 L85 31 Z" fill="#F3E7D3" stroke={stroke} strokeWidth="2" />
      <Line stroke={accent} strokeWidth="3" x1="86" x2="125" y1="31" y2="43" />
    </>
  );
}

function FatCap() {
  return (
    <>
      <Rect fill="#38251D" height="10" rx="5" stroke={muted} strokeWidth="2" width="126" x="17" y="69" />
      <Rect fill="#5A2418" height="58" rx="20" stroke={accent} strokeWidth="3" width="34" x="63" y="10" />
      <Rect fill="#F2C98B" height="54" rx="8" width="9" x="85" y="12" />
      <Path d="M108 61 C105 52 116 49 113 39 C124 49 122 58 116 64" fill="none" stroke={colors.yellow} strokeWidth="3" />
      <Line stroke={stroke} strokeWidth="3" x1="52" x2="67" y1="21" y2="30" />
      <Line stroke={stroke} strokeWidth="3" x1="108" x2="94" y1="21" y2="30" />
    </>
  );
}

function Oil() {
  return (
    <>
      <Ellipse cx="80" cy="67" fill="#211713" rx="61" ry="12" stroke={muted} strokeWidth="2" />
      <Path d="M34 63 C55 52 104 52 126 63 C104 69 55 69 34 63Z" fill="#E7A53A" opacity="0.68" />
      <Path d="M73 33 C73 23 81 20 81 11 C91 23 91 30 87 35 C83 39 76 38 73 33Z" fill={colors.yellow} />
      <Path d="M46 47 C51 42 55 42 60 47 M99 45 C105 40 110 41 115 46" fill="none" stroke={stroke} strokeWidth="2" />
    </>
  );
}

function Butter() {
  return (
    <>
      <Ellipse cx="80" cy="68" fill="#211713" rx="61" ry="12" stroke={muted} strokeWidth="2" />
      <Rect fill={colors.yellow} height="25" rx="5" stroke={stroke} strokeWidth="2" width="38" x="61" y="37" />
      <Circle cx="43" cy="54" fill="none" r="6" stroke={colors.white} strokeWidth="2" />
      <Circle cx="112" cy="48" fill="none" r="5" stroke={colors.white} strokeWidth="2" />
      <Circle cx="122" cy="59" fill="none" r="3" stroke={colors.white} strokeWidth="2" />
      <Path d="M43 34 C49 26 53 28 58 20 M109 34 C117 25 123 28 129 19" fill="none" stroke="#75B66B" strokeWidth="4" />
    </>
  );
}

function Thermometer() {
  return (
    <>
      <Steak x={22} y={34} width={116} height={38} />
      <Path d="M146 21 L74 51" fill="none" stroke={stroke} strokeWidth="5" />
      <Circle cx="147" cy="20" fill={colors.surfaceRaised} r="10" stroke={accent} strokeWidth="3" />
      <Circle cx="74" cy="51" fill={colors.yellow} r="4" />
      <Line stroke={colors.yellow} strokeDasharray="4 3" strokeWidth="2" x1="80" x2="80" y1="28" y2="76" />
      <Path d="M114 28 L103 32 L109 39" fill="none" stroke={accent} strokeWidth="2.5" />
      <Path d="M52 79 C68 84 91 84 108 78" fill="none" stroke={muted} strokeWidth="2" />
    </>
  );
}
