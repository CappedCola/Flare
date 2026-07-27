import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleAchievementledger, type AchievementledgerRequest } from './handler';
import { AchievementledgerService } from './service';
import type { AchievementledgerRecord } from './persistence';

export type AchievementledgerPanelProps = {
  service: AchievementledgerService;
  onSelect?: (record: AchievementledgerRecord) => void;
  onRemove?: (id: string) => void;
};

export function AchievementledgerPanel({ service, onSelect, onRemove }: AchievementledgerPanelProps) {
  const initialRecords = service.search();
  const [records, setRecords] = useState<AchievementledgerRecord[]>(initialRecords);
  const [message, setMessage] = useState(`${initialRecords.length} achievement ledger`);


  const remove = (id: string) => {
    const response = handleAchievementledger(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: AchievementledgerRequest = { action: 'list' };
    const response = handleAchievementledger(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} achievement ledger`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };


  return (
    <View accessibilityLabel="achievementLedger-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.userId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
