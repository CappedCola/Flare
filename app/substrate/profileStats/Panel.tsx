import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleProfilestats, type ProfilestatsRequest } from './handler';
import { ProfilestatsService } from './service';
import type { ProfilestatsRecord } from './persistence';

export type ProfilestatsPanelProps = {
  service: ProfilestatsService;
  onSelect?: (record: ProfilestatsRecord) => void;
  onRemove?: (id: string) => void;
};

export function ProfilestatsPanel({ service, onSelect, onRemove }: ProfilestatsPanelProps) {
  const initialRecords = service.search();
  const [records, setRecords] = useState<ProfilestatsRecord[]>(initialRecords);
  const [message, setMessage] = useState(`${initialRecords.length} profile stats`);


  const remove = (id: string) => {
    const response = handleProfilestats(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: ProfilestatsRequest = { action: 'list' };
    const response = handleProfilestats(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} profile stats`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };


  return (
    <View accessibilityLabel="profileStats-panel">
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
