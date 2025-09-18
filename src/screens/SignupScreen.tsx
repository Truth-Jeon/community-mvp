import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import Header from '../components/Header';
import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'; // Firestore 함수 import

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [nickname, setNickname] = useState(''); // 닉네임 상태 추가
  const [isCheckingNickname, setIsCheckingNickname] = useState(false); // 닉네임 중복 확인 로딩 상태
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null
  ); // 닉네임 사용 가능 여부
  const [loading, setLoading] = useState(false); // 회원가입 로딩 상태

  const mismatch = useMemo(
    () => pw.length > 0 && pw2.length > 0 && pw !== pw2,
    [pw, pw2]
  );

  const normalize = (s: string) => s.trim().toLowerCase();

  //닉네임 중복 확인 함수
  const checkNicknameAvailability = async () => {
    const raw = nickname;
    const uname = normalize(raw);
    if (uname === '') {
      setNicknameAvailable(null);
      return;
    }
    setIsCheckingNickname(true);
    try {
      // ✅ users 쿼리 금지. usernames/{uname} 단건 조회로 변경
      const snap = await getDoc(doc(db, 'usernames', uname));
      setNicknameAvailable(!snap.exists()); // 문서가 없으면 사용 가능
    } catch (e) {
      console.error('Error checking nickname:', e);
      // 네트워크/기타 오류 시에는 상태를 모름(null)으로 두는 게 UX상 더 나음
      setNicknameAvailable(null);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(checkNicknameAvailability, 500); // 0.5초 디바운스
    return () => clearTimeout(handler);
  }, [nickname]);

  const isNicknameValid = useMemo(() => {
    return nickname.length > 0 && nickname.length <= 5;
  }, [nickname]);

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
    const uname = normalize(nickname);
    if (mismatch || !nicknameAvailable || !isNicknameValid) {
      Alert.alert('회원가입 실패', '닉네임은 1~5글자여야 합니다.');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      const user = cred.user;

      await runTransaction(db, async (tx) => {
        const uname = normalize(nickname);
        const unameRef = doc(db, 'usernames', uname);
        const userRef = doc(db, 'users', user.uid);

        const unameSnap = await tx.get(unameRef);
        if (unameSnap.exists()) throw new Error('TAKEN');

        tx.set(unameRef, { uid: user.uid, createdAt: serverTimestamp() });
        tx.set(userRef, {
          email: user.email,
          nickname: uname,
          displayName: nickname.trim(),
          createdAt: serverTimestamp(),
        });
      });

      Alert.alert('회원가입 완료', '이제 로그인해 주세요.');
      navigation.goBack();
    } catch (e: any) {
      // 🔥 트랜잭션 등 실패 시 방금 만든 Auth 계정 제거
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch {}
      }
      const msg =
        e?.message === 'TAKEN'
          ? '이미 사용 중인 닉네임입니다.'
          : e?.message ?? '회원가입에 실패했습니다.';
      Alert.alert('회원가입 실패', msg);
    } finally {
      setLoading(false);
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
        <View>
          <TextInput
            placeholder="닉네임"
            value={nickname}
            onChangeText={setNickname}
            style={styles.input}
          />
          {!isNicknameValid && nickname.length > 0 && (
            <Text style={{ color: 'red', marginTop: 5 }}>
              닉네임은 1~5글자여야 합니다.
            </Text>
          )}
          {isCheckingNickname && <ActivityIndicator style={styles.indicator} />}
          {nicknameAvailable !== null && isNicknameValid && (
            <Text style={{ color: nicknameAvailable ? 'green' : 'red' }}>
              {nicknameAvailable
                ? '사용 가능한 닉네임입니다'
                : '이미 사용 중인 닉네임입니다'}
            </Text>
          )}
        </View>
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
          disabled={
            !email ||
            !pw ||
            !pw2 ||
            !nickname ||
            mismatch ||
            isCheckingNickname ||
            !nicknameAvailable ||
            !isNicknameValid ||
            loading
          }
          style={[
            styles.signupBtn,
            (!email ||
              !pw ||
              !pw2 ||
              !nickname ||
              mismatch ||
              isCheckingNickname ||
              !nicknameAvailable ||
              !isNicknameValid) &&
              styles.signupBtnDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.signupText,
                (!email ||
                  !pw ||
                  !pw2 ||
                  !nickname ||
                  mismatch ||
                  isCheckingNickname ||
                  !nicknameAvailable) &&
                  styles.signupTextDisabled,
              ]}
            >
              회원가입
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 6,
  },
  indicator: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
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
