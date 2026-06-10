import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from './PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { api } from '@/services/api';
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { LabMarker } from '@/models/types';
import { todayISO } from '@/utils/date';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  high: colors.danger, low: colors.warning, normal: colors.success, unknown: colors.textMuted,
};

/** Pick an image/PDF on web and return its base64 + media type. */
function pickFile(): Promise<{ base64: string; mediaType: string } | null> {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return resolve(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        const res = String(reader.result);
        resolve({ base64: res.split(',')[1] ?? '', mediaType: f.type || 'image/jpeg' });
      };
      reader.readAsDataURL(f);
    };
    input.click();
  });
}

export function LabsModal({ visible, onClose }: Props) {
  const { token } = useAuth();
  const { data, addLab, removeEntry } = useData();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ summary: string; markers: LabMarker[] } | null>(null);
  const [err, setErr] = useState('');

  const upload = async () => {
    setErr('');
    const file = await pickFile();
    if (!file) { setErr('File picking is available on the web app.'); return; }
    setBusy(true);
    setResult(null);
    try {
      const r = await api.analyzeLab(file.base64, file.mediaType);
      setResult({ summary: r.summary, markers: r.markers });
      if (r.offline) setErr(r.summary);
    } catch (e: any) {
      setErr(e.message || 'Analysis failed.');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!result) return;
    addLab({ date: todayISO(), summary: result.summary, markers: result.markers });
    setResult(null);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>AI Lab Analysis</Text>
              <Text style={type.title}>Lab reports</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {!token ? (
              <Text style={styles.note}>Sign in to analyze and save your lab reports securely.</Text>
            ) : (
              <>
                <Text style={styles.intro}>Upload a photo or PDF of a blood panel — AI extracts your markers, flags out-of-range values, and explains them.</Text>
                <PrimaryButton label={busy ? 'Analyzing…' : '＋ Upload lab report'} onPress={upload} gradient={gradients.water} disabled={busy} />
                {busy ? <ActivityIndicator color={colors.water} style={{ marginTop: spacing.lg }} /> : null}
                {err ? <Text style={styles.err}>{err}</Text> : null}

                {result ? (
                  <View style={styles.resultCard}>
                    {result.summary ? <Text style={styles.summary}>{result.summary}</Text> : null}
                    {result.markers.map((m, i) => (
                      <View key={i} style={styles.markerRow}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[m.status] ?? colors.textMuted }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.markerName}>{m.name}</Text>
                          {m.note ? <Text style={styles.markerNote}>{m.note}</Text> : null}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.markerVal, { color: STATUS_COLOR[m.status] ?? colors.text }]}>{m.value}{m.unit ? ` ${m.unit}` : ''}</Text>
                          {m.range ? <Text style={styles.markerRange}>{m.range}</Text> : null}
                        </View>
                      </View>
                    ))}
                    {result.markers.length > 0 ? <PrimaryButton label="Save to my records" onPress={save} gradient={gradients.water} style={{ marginTop: spacing.md }} /> : null}
                    <Text style={styles.disclaimer}>Educational only — not a medical diagnosis. Discuss results with your doctor.</Text>
                  </View>
                ) : null}

                {data.labs.length > 0 ? (
                  <>
                    <Text style={[type.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Your records</Text>
                    {data.labs.map((l) => (
                      <View key={l.id} style={styles.histRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.histDate}>{new Date(l.createdAt).toLocaleDateString()} · {l.markers.length} markers</Text>
                          {l.summary ? <Text style={styles.histSummary} numberOfLines={2}>{l.summary}</Text> : null}
                        </View>
                        <Pressable onPress={() => removeEntry('labs', l.id)} hitSlop={8}><Text style={styles.remove}>Remove</Text></Pressable>
                      </View>
                    ))}
                  </>
                ) : null}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  eyebrow: { ...type.label, color: colors.water, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0 },
  note: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl, lineHeight: 22 },
  intro: { ...type.body, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.lg },
  err: { ...type.caption, color: colors.danger, marginTop: spacing.md },
  resultCard: { marginTop: spacing.lg },
  summary: { ...type.body, fontWeight: '600', marginBottom: spacing.md, lineHeight: 21 },
  markerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  markerName: { ...type.body, fontWeight: '600' },
  markerNote: { ...type.caption, marginTop: 1 },
  markerVal: { ...type.body, fontWeight: '700' },
  markerRange: { ...type.caption },
  disclaimer: { ...type.caption, marginTop: spacing.md, lineHeight: 18 },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  histDate: { ...type.body, fontWeight: '600' },
  histSummary: { ...type.caption, marginTop: 2 },
  remove: { fontSize: 12, fontWeight: '600', color: colors.danger, marginLeft: spacing.md },
});
