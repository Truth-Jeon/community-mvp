import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title?: string;
  showBack?: boolean; //true일 때만 뒤로가기 버튼 표시
  onBack?: () => void; // 없으면 뒤로가기 버튼 감춤
  right?: React.ReactNode; // 우측 액션 버튼들 (옵션)
};

export default function Header({
  title,
  showBack = false,
  onBack,
  right,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: '#fff' }}>
      {/* 상태바 높이 만큼 패딩 */}
      {/* <View style={{ height: insets.top, backgroundColor: '#fff' }} /> */}
      <View
        style={{
          height: 48,
          //   height: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        }}
      >
        {/* 왼쪽: Back */}
        <View
          style={{
            width: 48,
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          {showBack && onBack ? (
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 18 }}>‹</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 가운데: Title */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
            {title ?? ''}
          </Text>
        </View>

        {/* 오른쪽: 액션 */}
        <View
          style={{
            width: 48,
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          {right ?? null}
        </View>
      </View>
    </View>
  );
}
