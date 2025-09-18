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
  Alert,
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
  deleteDoc,
  getDocs,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';

const COMPOSER_HEIGHT = 52;

type Post = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  authorId?: string | null;
  authorNickname?: string | null;
  createdAt?: any;
};

type Comment = {
  id: string;
  text: string;
  authorId?: string | null;
  authorNickname?: string;
  createdAt?: any;
};

export default function PostDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const [myNickname, setMyNickname] = useState<string | null>(null);

  // 하드웨어 뒤로가기
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

  // 포스트 로드 (+ authorNickname 없으면 1회 보완 조회)
  useEffect(() => {
    (async () => {
      const s = await getDoc(doc(db, 'posts', id));
      if (!s.exists()) {
        Alert.alert('안내', '삭제되었거나 존재하지 않는 게시글입니다.');
        navigation.goBack();
        return;
      }
      const p = { id: s.id, ...(s.data() as Omit<Post, 'id'>) } as Post;
      if (!p.authorNickname && p.authorId) {
        const u = await getDoc(doc(db, 'users', p.authorId));
        p.authorNickname = u.exists()
          ? (u.data() as any)?.displayName ??
            (u.data() as any)?.nickname ??
            '익명'
          : '익명';
      }
      setPost(p);
    })();
  }, [id, navigation]);

  // 내 닉네임(댓글 작성용) 로드
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setMyNickname(data.displayName ?? data.nickname ?? null);
      }
    });
  }, []);

  // 댓글 실시간
  useEffect(() => {
    const commentsRef = collection(db, 'posts', id, 'comments');
    const qy = query(commentsRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qy, (snap) => {
      const list: Comment[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Comment, 'id'>),
      }));
      setComments(list);
    });
    return () => unsub();
  }, [id]);

  // 댓글 작성
  const addComment = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, 'posts', id, 'comments'), {
      text,
      authorId: auth.currentUser?.uid ?? null,
      authorNickname: myNickname ?? '익명',
      createdAt: serverTimestamp(),
    });
    setText('');
  };

  // 댓글 삭제(내 거만)
  const deleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id, 'comments', commentId));
    } catch (e: any) {
      Alert.alert('삭제 실패', e?.message ?? '댓글 삭제에 실패했습니다.');
    }
  };

  // 게시글 삭제(내 글만) — 댓글 먼저 지우고 글 삭제
  const deletePost = async () => {
    Alert.alert(
      '삭제 확인',
      '이 게시글을 삭제할까요? 댓글도 함께 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // 댓글 일괄 삭제 (최대 500개씩)
              while (true) {
                const snap = await getDocs(
                  query(collection(db, 'posts', id, 'comments'), limit(500))
                );
                if (snap.empty) break;
                const batch = writeBatch(db);
                snap.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
              }
              await deleteDoc(doc(db, 'posts', id));
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(
                '삭제 실패',
                e?.message ?? '게시글 삭제에 실패했습니다.'
              );
            }
          },
        },
      ]
    );
  };

  if (!post) return null;

  const isMine = post.authorId && post.authorId === auth.currentUser?.uid;

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
          right={
            isMine ? (
              <TouchableOpacity
                onPress={deletePost}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ color: '#ff5555', fontWeight: '600' }}>
                  삭제
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />

        <View style={{ flex: 1 }}>
          <FlatList<Comment>
            data={comments}
            keyExtractor={(i) => i.id}
            ListHeaderComponent={
              <View style={{ padding: 16, gap: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  {post.title}
                </Text>
                {/* 작성자 닉네임 */}
                <Text style={{ color: '#666' }}>
                  작성자: {post.authorNickname ?? '익명'}
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
            renderItem={({ item }) => {
              const mine =
                item.authorId && item.authorId === auth.currentUser?.uid;
              return (
                <View
                  style={{
                    flexDirection: 'row',
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      marginRight: 12,
                      fontWeight: 'bold',
                      maxWidth: 80,
                    }}
                    numberOfLines={1}
                  >
                    {item.authorNickname ?? '익명'}
                  </Text>

                  <Text
                    style={{ flex: 1 }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.text}
                  </Text>

                  {mine ? (
                    <TouchableOpacity
                      onPress={() => deleteComment(item.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={{ color: '#ff5555', marginLeft: 8 }}>
                        삭제
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            }}
            contentContainerStyle={{
              paddingBottom: COMPOSER_HEIGHT + insets.bottom + 8,
            }}
          />

          {/* 하단 입력바 */}
          <View
            style={[
              styles.composerWrap,
              { flexDirection: 'row', bottom: 0, paddingBottom: insets.bottom },
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
    maxHeight: 100,
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
