import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  FlatList,
  Text,
  Button,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

export default function PostListScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);

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
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header
        title="게시글 목록"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      <View style={{ flex: 1 }}>
        <FlatList
          data={posts}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('PostDetail', { id: item.id })}
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
              <Text numberOfLines={2}>{item.content}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('PostCreate')}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  postCreateBtn: {
    width: 100,
    backgroundColor: '#8A73FF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  postCreateText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24, // 화면 하단에서 24px 위
    right: 24, // 화면 오른쪽에서 24px 안쪽
    backgroundColor: '#8A73FF',
    width: 56,
    height: 56,
    borderRadius: 28, // 원형
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // 안드로이드 그림자
    shadowColor: '#000', // iOS 그림자
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
});
