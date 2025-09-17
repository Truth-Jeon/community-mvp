import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import React, { useCallback, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Header from '../components/Header';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      // ✅ replace 대신 navigate: 뒤로가기 살리기
      navigation.navigate('Posts');
    } catch (e: any) {
      // Firebase 최신 SDK 기준 잘못된 자격 증명 관련 코드들
      const code = e?.code as string;
      const wrong =
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-email';
      if (wrong) {
        Alert.alert('로그인 실패', 'Email 또는 비밀번호가 틀렸습니다.');
      } else {
        Alert.alert('로그인 실패', e?.message ?? '로그인에 실패했습니다.');
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="로그인" />
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

        <TouchableOpacity onPress={login} style={styles.loginBtn}>
          <Text style={styles.loginText}>로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          style={styles.signupBtn}
        >
          <Text style={styles.signupText}>회원가입 하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginBtn: {
    backgroundColor: '#8A73FF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  signupBtn: {
    borderWidth: 1,
    borderColor: '#8A73FF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  signupText: {
    color: '#8A73FF',
    textAlign: 'center',
    fontWeight: '600',
  },
});
