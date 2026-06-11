import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { PrimaryButton } from './PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

type PickedImage = { base64: string; mediaType: string } | null;

/** Native camera / library via expo-image-picker. */
async function nativePick(useCamera: boolean): Promise<PickedImage> {
  const perm = useCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const opts: ImagePicker.ImagePickerOptions = { base64: true, quality: 0.6, mediaTypes: ImagePicker.MediaTypeOptions.Images };
  const res = useCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { base64: a.base64 ?? '', mediaType: a.mimeType || 'image/jpeg' };
}
import { colors, gradients, radius, spacing, type } from '@/theme/colors';
import type { FoodItem, MealType } from '@/models/types';

interface Props {
  visible: boolean;
  mealType: MealType;
  onAdd: (items: FoodItem[]) => void;
  onClose: () => void;
}

/** Pick an image on web and return base64 + media type (mirrors LabsModal). */
function pickImage(): Promise<{ base64: string; mediaType: string } | null> {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return resolve(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: String(reader.result).split(',')[1] ?? '', mediaType: f.type || 'image/jpeg' });
      reader.readAsDataURL(f);
    };
    input.click();
  });
}

export function PhotoLogModal({ visible, mealType, onAdd, onClose }: Props) {
  const { token } = useAuth();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [barcode, setBarcode] = useState('');

  const reset = () => { setItems([]); setNote(''); setErr(''); setBarcode(''); };
  const close = () => { reset(); onClose(); };

  const runAnalyze = async (img: PickedImage) => {
    if (!img || !img.base64) return;
    setErr(''); setBusy(true);
    try {
      const r = await api.analyzeFoodPhoto(img.base64, img.mediaType as any);
      const mapped: FoodItem[] = (r.items || []).map((i: any) => ({
        name: i.name, calories: Math.round(i.calories || 0),
        protein: i.protein, carbs: i.carbs, fat: i.fat,
      }));
      setItems((prev) => [...prev, ...mapped]);
      if (r.note) setNote(r.note);
      if (mapped.length === 0) setErr("Couldn't identify foods — try another photo or add manually.");
    } catch (e: any) {
      setErr(e.message || 'Photo analysis needs the AI coach (ANTHROPIC_API_KEY) configured.');
    } finally { setBusy(false); }
  };

  const snapWeb = async () => {
    setErr('');
    const img = await pickImage();
    if (!img) { setErr('Choose an image to analyze.'); return; }
    runAnalyze(img);
  };
  const snapCamera = async () => runAnalyze(await nativePick(true));
  const snapLibrary = async () => runAnalyze(await nativePick(false));

  const lookup = async () => {
    const code = barcode.trim();
    if (!code) return;
    setErr(''); setBusy(true);
    try {
      const f = await api.lookupBarcode(code);
      setItems((prev) => [...prev, { name: f.name + (f.brand ? ` (${f.brand})` : ''), calories: Math.round(f.calories), protein: f.protein ?? undefined, carbs: f.carbs ?? undefined, fat: f.fat ?? undefined }]);
      setBarcode('');
    } catch (e: any) {
      setErr(e.message || 'No product found for that barcode.');
    } finally { setBusy(false); }
  };

  const setCal = (idx: number, v: string) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, calories: Number.parseInt(v, 10) || 0 } : it)));
  const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const totalCal = items.reduce((a, b) => a + b.calories, 0);
  const addAll = () => { if (items.length) { onAdd(items); close(); } };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>AI food logging</Text>
              <Text style={type.title}>Snap or scan</Text>
            </View>
            <Pressable onPress={close} hitSlop={10} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {!token ? (
              <Text style={styles.note}>Sign in to use AI photo logging.</Text>
            ) : (
              <>
                <Text style={styles.intro}>Snap your plate — AI identifies the foods and estimates calories & macros. Or scan a barcode.</Text>
                {Platform.OS === 'web' ? (
                  <PrimaryButton label={busy ? 'Analyzing…' : '📸 Photograph your meal'} onPress={snapWeb} gradient={gradients.meal} disabled={busy} />
                ) : (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <PrimaryButton label={busy ? '…' : '📷 Take photo'} onPress={snapCamera} gradient={gradients.meal} disabled={busy} style={{ flex: 1 }} />
                    <PrimaryButton label="🖼 Library" onPress={snapLibrary} variant="soft" color={colors.meal} disabled={busy} style={{ flex: 1 }} />
                  </View>
                )}

                <View style={styles.barcodeRow}>
                  <TextInput style={styles.barcodeInput} placeholder="Barcode number" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={barcode} onChangeText={setBarcode} />
                  <PrimaryButton label="Look up" onPress={lookup} variant="soft" color={colors.meal} disabled={busy || !barcode.trim()} style={{ minWidth: 96 }} />
                </View>

                {busy ? <ActivityIndicator color={colors.meal} style={{ marginTop: spacing.lg }} /> : null}
                {err ? <Text style={styles.err}>{err}</Text> : null}
                {note ? <Text style={styles.aiNote}>{note}</Text> : null}

                {items.length > 0 ? (
                  <View style={styles.results}>
                    <Text style={styles.resultsHead}>Detected · {totalCal} kcal total</Text>
                    {items.map((it, i) => (
                      <View key={i} style={styles.itemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{it.name}</Text>
                          {it.protein != null ? <Text style={styles.itemMacros}>P{Math.round(it.protein)} · C{Math.round(it.carbs ?? 0)} · F{Math.round(it.fat ?? 0)}</Text> : null}
                        </View>
                        <TextInput style={styles.calInput} keyboardType="number-pad" value={String(it.calories)} onChangeText={(v) => setCal(i, v)} />
                        <Text style={styles.kcal}>kcal</Text>
                        <Pressable onPress={() => remove(i)} hitSlop={8}><Text style={styles.remove}>✕</Text></Pressable>
                      </View>
                    ))}
                    <PrimaryButton label={`Add ${items.length} item${items.length > 1 ? 's' : ''} to ${mealType}`} onPress={addAll} gradient={gradients.primary} style={{ marginTop: spacing.md }} />
                  </View>
                ) : null}

                <Text style={styles.disclaimer}>AI estimates are approximate — adjust calories before saving for best accuracy.</Text>
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
  eyebrow: { ...type.label, color: colors.meal, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  note: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  intro: { ...type.body, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.lg },
  barcodeRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.md },
  barcodeInput: { flex: 1, backgroundColor: colors.backgroundAlt, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.text, ...type.body },
  err: { ...type.caption, color: colors.danger, marginTop: spacing.md },
  aiNote: { ...type.caption, color: colors.textSecondary, marginTop: spacing.md, fontStyle: 'italic' },
  results: { marginTop: spacing.lg },
  resultsHead: { ...type.label, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { ...type.body, fontWeight: '600' },
  itemMacros: { ...type.caption, marginTop: 1 },
  calInput: { width: 64, backgroundColor: colors.backgroundAlt, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, textAlign: 'right', color: colors.text, ...type.body },
  kcal: { ...type.caption },
  remove: { color: colors.danger, fontSize: 16, fontWeight: '700', marginLeft: 4 },
  disclaimer: { ...type.caption, marginTop: spacing.xl, lineHeight: 18 },
});
