import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import Header from '../components/Header';

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const mismatch = useMemo(
    () => pw.length > 0 && pw2.length > 0 && pw !== pw2,
    [pw, pw2]
  );

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        navigation.goBack();
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onHardwareBack
      );
      return () => sub.remove();
    }, [navigation])
  );

  const signup = async () => {
    if (mismatch) return;
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pw);
      Alert.alert('회원가입 완료', '이제 로그인해 주세요.');
      navigation.goBack(); // ✅ 회원가입 이후 로그인 화면으로
    } catch (e: any) {
      Alert.alert('회원가입 실패', e?.message ?? '회원가입에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header
        title="회원가입"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      <View style={{ padding: 16, gap: 10 }}>
        <TextInput
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ borderWidth: 1, padding: 12, borderRadius: 6 }}
        />
        <TextInput
          placeholder="비밀번호"
          value={pw}
          onChangeText={setPw}
          secureTextEntry
          style={{ borderWidth: 1, padding: 12, borderRadius: 6 }}
        />
        <TextInput
          placeholder="비밀번호 확인"
          value={pw2}
          onChangeText={setPw2}
          secureTextEntry
          style={{ borderWidth: 1, padding: 12, borderRadius: 6 }}
        />
        {mismatch && <Text style={{ color: 'red' }}>비밀번호가 다릅니다</Text>}
        <TouchableOpacity
          onPress={signup}
          disabled={!email || !pw || !pw2 || mismatch}
          style={[
            styles.signupBtn,
            (!email || !pw || !pw2 || mismatch) && styles.signupBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.signupText,
              (!email || !pw || !pw2 || mismatch) && styles.signupBtnDisabled,
            ]}
          >
            회원가입
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  signupBtn: {
    backgroundColor: '#8A73FF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  signupText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  signupBtnDisabled: {
    backgroundColor: '#ccc',
  },
  signupTextDisabled: {
    color: '#fff',
  },
});
