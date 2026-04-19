import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoLog, useLogEntries, type LogEntry } from './Logger';

interface Props {
  visible: boolean;
  onClose(): void;
}

export function LogsView({ visible, onClose }: Props) {
  const entries = useLogEntries();

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Logs</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton} onPress={DemoLog.clear}>
              <Text style={styles.headerButtonText}>Clear</Text>
            </Pressable>
            <Pressable style={styles.headerButton} onPress={onClose}>
              <Text style={styles.headerButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LogRow entry={item} />}
          ListEmptyComponent={<Text style={styles.empty}>No log entries yet.</Text>}
          contentContainerStyle={entries.length === 0 ? styles.emptyWrap : undefined}
        />
      </SafeAreaView>
    </Modal>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const ts = formatTime(entry.timestamp);
  const levelStyle = entry.level === 'error' ? styles.rowError : styles.rowInfo;
  return (
    <View style={styles.row}>
      <Text style={styles.ts}>{ts}</Text>
      <Text style={levelStyle}>{entry.level.toUpperCase()}</Text>
      <Text style={styles.msg} selectable>{entry.message}</Text>
    </View>
  );
}

function formatTime(date: Date): string {
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomColor: '#e5e5e5',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: { color: '#007aff', fontSize: 15 },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ts: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: '#888',
    width: 84,
  },
  rowInfo: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: '#444',
    width: 48,
  },
  rowError: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: '#d00',
    width: 48,
    fontWeight: '600',
  },
  msg: {
    fontFamily: 'Menlo',
    fontSize: 11,
    flex: 1,
    color: '#111',
  },
  empty: { textAlign: 'center', color: '#888' },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});
