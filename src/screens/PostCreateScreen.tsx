import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  TextInput,
  Button,
  Alert,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import React, { useCallback, useState, useEffect } from 'react';
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, storage, auth } from '../lib/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import Header from '../components/Header';

export default function PostCreateScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 ?? null);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri) return null;
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const path = `posts/${auth.currentUser?.uid ?? 'anon'}_${Date.now()}.jpg`;
      const storageRef = ref(storage, path);

      console.log('[UPLOAD] path:', path, 'type:', blob.type);

      const snap = await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(snap.ref);
      console.log('[UPLOAD] url:', url);

      return url;
    } catch (e: any) {
      console.log('[UPLOAD ERROR]', e?.code, e?.message);
      return null;
    }
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage();

      const uid = auth.currentUser?.uid ?? null;
      let authorNickname: string | null = null;
      if (uid) {
        const u = await getDoc(doc(db, 'users', uid));
        authorNickname = u.exists()
          ? (u.data() as any)?.displayName ??
            (u.data() as any)?.nickname ??
            null
          : null;
      }

      // 이 부분에서 Firestore 쓰기 권한이 없으면 에러 발생
      await addDoc(collection(db, 'posts'), {
        title,
        content,
        imageUrl: imageUrl ?? null,
        authorId: uid,
        authorNickname: authorNickname ?? '익명', // ← 추가
        createdAt: serverTimestamp(),
      });

      navigation.goBack();
    } catch (e: any) {
      console.error('[SUBMIT ERROR]', e.code, e.message);
      Alert.alert('작성 실패', `오류: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header
        title="게시글 작성하기"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      <View style={{ padding: 16, gap: 8 }}>
        <TextInput
          placeholder="제목"
          value={title}
          onChangeText={setTitle}
          style={{ borderWidth: 1, padding: 12, borderRadius: 6 }}
        />
        <TextInput
          placeholder="내용"
          value={content}
          onChangeText={setContent}
          multiline
          style={{ borderWidth: 1, padding: 12, height: 120, borderRadius: 6 }}
        />
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: 200 }}
          />
        )}
        <TouchableOpacity onPress={pickImage} style={styles.imageAddBtn}>
          <Text style={styles.imageAddText}>이미지 첨부</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={submit} style={styles.submitBtn}>
          <Text style={styles.submitText}>등록</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  submitBtn: {
    backgroundColor: '#8A73FF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  imageAddBtn: {
    borderWidth: 1,
    borderColor: '#8A73FF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  imageAddText: {
    color: '#8A73FF',
    textAlign: 'center',
    fontWeight: '600',
  },
});
