import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api, apiEnabled } from '@/services/api';
import { colors, radius, spacing, type } from '@/theme/colors';
import { BRAND } from '@/theme/brand';

interface Props {
  visible: boolean;
  onClose: () => void;
}
interface Msg { role: 'user' | 'assistant'; content: string }

const GREETING: Msg = {
  role: 'assistant',
  content: `Hi! I'm your ${BRAND} coach 👋 Ask me about your meals, training, sleep, or metabolic health — I'll use your recent data to help.`,
};
const SUGGESTIONS = ['What should I eat today?', 'Am I on track with my goals?', 'How can I improve my sleep?'];

/** Claude-powered AI health coach chat. */
export function CoachModal({ visible, onClose }: Props) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [visible, messages]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || busy) return;
    const history = messages.filter((m) => m !== GREETING).slice(-10);
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setInput('');
    setBusy(true);
    try {
      const res = await api.coachChat(msg, history);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: e.message || 'Sorry, I had trouble responding. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>AI Coach</Text>
              <Text style={type.title}>Ask your coach</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {!token ? (
            <View style={styles.center}>
              <Text style={styles.signinNote}>Sign in to chat with your AI coach — it personalizes advice from your logged data.</Text>
            </View>
          ) : (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
                {messages.map((m, i) => (
                  <View key={i} style={[styles.bubble, m.role === 'user' ? styles.user : styles.assistant]}>
                    <Text style={[styles.msgText, m.role === 'user' && styles.userText]}>{m.content}</Text>
                  </View>
                ))}
                {busy ? <View style={[styles.bubble, styles.assistant]}><ActivityIndicator color={colors.primary} /></View> : null}
                {messages.length === 1 ? (
                  <View style={styles.suggestions}>
                    {SUGGESTIONS.map((s) => (
                      <Pressable key={s} style={styles.suggestion} onPress={() => send(s)}>
                        <Text style={styles.suggestionText}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {!apiEnabled ? <Text style={styles.offline}>Coach runs in offline mode until the backend is connected.</Text> : null}
              </ScrollView>

              <SafeAreaView edges={['bottom']} style={styles.inputBar}>
                <TextInput
                  style={styles.input}
                  placeholder="Message your coach…"
                  placeholderTextColor={colors.textMuted}
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => send(input)}
                  returnKeyType="send"
                  editable={!busy}
                />
                <Pressable style={[styles.sendBtn, (!input.trim() || busy) && { opacity: 0.4 }]} onPress={() => send(input)} disabled={!input.trim() || busy}>
                  <Text style={styles.sendText}>➤</Text>
                </Pressable>
              </SafeAreaView>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  eyebrow: { ...type.label, color: colors.primary, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  signinNote: { ...type.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  messages: { padding: spacing.lg, gap: spacing.md },
  bubble: { maxWidth: '85%', borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  user: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  assistant: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  msgText: { ...type.body, lineHeight: 21 },
  userText: { color: colors.textInverse },
  suggestions: { gap: spacing.sm, marginTop: spacing.sm },
  suggestion: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  suggestionText: { ...type.caption, color: colors.primaryDark, fontWeight: '600' },
  offline: { ...type.caption, textAlign: 'center', marginTop: spacing.md },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.backgroundAlt, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: 12, fontSize: 15, color: colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: colors.textInverse, fontSize: 18 },
});
