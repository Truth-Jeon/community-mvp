import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';

const COMPOSER_HEIGHT = 52;

export default function PostDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const shortUid = (uid?: string | null) => (uid ? uid.slice(0, 6) : '익명');

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

  useEffect(() => {
    getDoc(doc(db, 'posts', id)).then((s) =>
      setPost({ id: s.id, ...s.data() })
    );
    const q = query(
      collection(db, 'posts', id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) =>
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [id]);

  const addComment = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, 'posts', id, 'comments'), {
      text,
      authorId: auth.currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
    });
    setText('');
  };

  if (!post) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#fff' }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={0}
      >
        <Header
          title="게시글 상세보기"
          showBack
          onBack={() => navigation.goBack()}
        />

        <View style={{ flex: 1 }}>
          <FlatList
            data={comments}
            keyExtractor={(i) => i.id}
            ListHeaderComponent={
              <View style={{ padding: 16, gap: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  {post.title}
                </Text>
                {post.imageUrl ? (
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={{ width: '100%', height: 220, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                ) : null}
                <Text>{post.content}</Text>

                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee',
                    padding: 10,
                  }}
                />
                <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                  <Text>댓글</Text>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 16,
                  marginBottom: 8,
                }}
              >
                <Text style={{ marginRight: 20, fontWeight: 'bold' }}>
                  {shortUid(item.authorId)}
                </Text>
                <Text
                  style={{ flex: 1 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.text}
                </Text>
              </View>
            )}
            // ✅ 하단 고정 입력바와 겹치지 않도록 여유
            contentContainerStyle={{
              paddingBottom: COMPOSER_HEIGHT + insets.bottom + 8,
            }}
          />

          {/* ✅ 하단 고정 입력바 */}

          <View
            style={[
              styles.composerWrap,
              { flexDirection: 'row', bottom: 0, paddingBottom: insets.bottom }, // 바닥에 딱 붙이기
            ]}
          >
            <TextInput
              placeholder="댓글 달기"
              value={text}
              onChangeText={setText}
              style={styles.commentInput}
              multiline
            />
            <TouchableOpacity onPress={addComment} style={styles.commentBtn}>
              <Text style={styles.commentText}>등록</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  composerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: COMPOSER_HEIGHT,
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxHeight: 100, // 멀티라인 팽창 방지
  },
  commentBtn: {
    backgroundColor: '#8A73FF',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
