import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDemoState } from './DemoState';
import { LogsView } from './LogsView';

/**
 * Mirrors `ContentView.swift` from the iOS demo:
 * - Configure (always enabled)
 * - UID field (disabled until configured)
 * - Set Identity / Identify Account (enabled when configured && uid not empty)
 * - Subscribe (enabled after both identity paths succeed)
 * - Unsubscribe (enabled after Subscribe)
 * - Reset (always enabled, destructive tint)
 * - Toolbar Logs button opens a full-screen modal log.
 */
export function MainView() {
  const state = useDemoState();
  const [showLogs, setShowLogs] = useState(false);

  const identityEnabled = state.isConfigured && state.uid.length > 0;
  const subscribeEnabled =
    state.isIdentitySet && state.isIdentified && !state.isSubscribed;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>DashX Demo</Text>
        <Pressable
          style={styles.logsButton}
          onPress={() => setShowLogs(true)}
          accessibilityLabel="Logs"
        >
          <Text style={styles.logsButtonText}>Logs</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Configure */}
        <Section>
          <PrimaryButton
            title="Configure DashX"
            enabled
            onPress={state.doConfigure}
            success={state.isConfigured}
          />
          <ErrorText prefix="error" message={state.configureError} />
        </Section>

        {/* UID */}
        <Section>
          <Text style={styles.label}>User UID</Text>
          <TextInput
            style={[styles.input, !state.isConfigured && styles.inputDisabled]}
            editable={state.isConfigured}
            autoCapitalize="none"
            autoCorrect={false}
            value={state.uid}
            onChangeText={state.setUid}
            placeholder="User UID"
          />
        </Section>

        {/* Identity */}
        <Section>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <PrimaryButton
                title="Set DashX Identity"
                enabled={identityEnabled}
                onPress={state.doSetIdentity}
                success={state.isIdentitySet}
              />
            </View>
            <View style={styles.rowItem}>
              <PrimaryButton
                title="Identify Account"
                enabled={identityEnabled}
                onPress={state.doIdentify}
                success={state.isIdentified}
              />
            </View>
          </View>
          <ErrorText prefix="setIdentity" message={state.identitySetError} />
          <ErrorText prefix="identify" message={state.identifyError} />
        </Section>

        {/* Subscribe */}
        <Section>
          <PrimaryButton
            title="Subscribe to Notifications"
            enabled={subscribeEnabled}
            onPress={() => {
              void state.doSubscribe();
            }}
            success={state.isSubscribed}
          />
          <ErrorText prefix="subscribe" message={state.subscribeError} />
        </Section>

        {/* Unsubscribe */}
        <Section>
          <PrimaryButton
            title="Unsubscribe"
            enabled={state.isSubscribed}
            onPress={() => {
              void state.doUnsubscribe();
            }}
            success={false}
          />
          <ErrorText prefix="unsubscribe" message={state.unsubscribeError} />
        </Section>

        {/* Reset */}
        <Section>
          <Pressable
            onPress={state.doReset}
            style={styles.destructiveButton}
            accessibilityRole="button"
          >
            <Text style={styles.destructiveButtonText}>Reset</Text>
          </Pressable>
        </Section>
      </ScrollView>

      <LogsView visible={showLogs} onClose={() => setShowLogs(false)} />
    </SafeAreaView>
  );
}

// MARK: - Reusable bits

function Section({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

function PrimaryButton({
  title,
  enabled,
  success,
  onPress,
}: {
  title: string;
  enabled: boolean;
  success: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      style={({ pressed }) => [
        styles.primaryButton,
        !enabled && styles.primaryButtonDisabled,
        pressed && enabled && styles.primaryButtonPressed,
      ]}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.primaryButtonText,
          !enabled && styles.primaryButtonTextDisabled,
        ]}
      >
        {title}
        {success ? ' ✓' : ''}
      </Text>
    </Pressable>
  );
}

function ErrorText({
  prefix,
  message,
}: {
  prefix: string;
  message: string | null;
}) {
  if (!message) return null;
  return (
    <Text style={styles.errorText}>
      ↳ {prefix}: {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomColor: '#e5e5e5',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '600' },
  logsButton: { paddingHorizontal: 12, paddingVertical: 6 },
  logsButtonText: { color: '#007aff', fontSize: 15 },

  scroll: { padding: 16, gap: 20 },

  section: { gap: 10 },

  label: { fontSize: 12, color: '#666' },
  input: {
    borderColor: '#d0d0d0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  inputDisabled: { backgroundColor: '#efefef', color: '#888' },

  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },

  primaryButton: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { backgroundColor: '#b4c9e7' },
  primaryButtonPressed: { opacity: 0.8 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  primaryButtonTextDisabled: { color: '#eef2f8' },

  destructiveButton: {
    borderWidth: 1,
    borderColor: '#d00',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  destructiveButtonText: { color: '#d00', fontSize: 15, fontWeight: '500' },

  errorText: {
    color: '#d00',
    fontSize: 12,
    fontFamily: 'Menlo',
  },
});
