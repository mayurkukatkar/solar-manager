import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { RotateCcw, Check, PenTool } from 'lucide-react-native';

interface SignaturePadProps {
  onSignatureChange?: (svgPath: string) => void;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  height = 160,
  strokeColor = '#0F172A',
  strokeWidth = 3,
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [hasSignature, setHasSignature] = useState(false);

  const currentPathRef = useRef<string>('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        const start = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        currentPathRef.current = start;
        setCurrentPath(start);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        const next = `${currentPathRef.current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        currentPathRef.current = next;
        setCurrentPath(next);
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current) {
          const updated = [...paths, currentPathRef.current];
          setPaths(updated);
          currentPathRef.current = '';
          setCurrentPath('');
          setHasSignature(true);
          if (onSignatureChange) {
            onSignatureChange(updated.join(' '));
          }
        }
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    currentPathRef.current = '';
    setHasSignature(false);
    if (onSignatureChange) {
      onSignatureChange('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.canvasWrapper, { height }]} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((p, idx) => (
            <Path
              key={idx}
              d={p}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {currentPath ? (
            <Path
              d={currentPath}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
        </Svg>

        {!hasSignature && !currentPath && (
          <View style={styles.placeholderOverlay} pointerEvents="none">
            <PenTool size={20} color="#94A3B8" />
            <Text style={styles.placeholderText}>Sign with finger on glass here</Text>
            <View style={styles.signLine} />
          </View>
        )}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.statusIndicator}>
          {hasSignature ? (
            <View style={styles.verifiedBadge}>
              <Check size={12} color="#15803D" />
              <Text style={styles.verifiedText}>Signature Captured</Text>
            </View>
          ) : (
            <Text style={styles.pendingText}>Awaiting Client Signature</Text>
          )}
        </View>

        {hasSignature && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.75}>
            <RotateCcw size={13} color="#64748B" />
            <Text style={styles.clearBtnText}>Clear & Redo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  canvasWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  signLine: {
    width: 140,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  pendingText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
});
