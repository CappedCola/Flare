import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handlePhotoreactions, type PhotoreactionsRequest } from './handler';
import { PhotoreactionsService } from './service';
import type { PhotoreactionsRecord } from './persistence';

export type PhotoreactionsPanelProps = {
  service: PhotoreactionsService;
  onSelect?: (record: PhotoreactionsRecord) => void;
  onRemove?: (id: string) => void;
};

export function PhotoreactionsPanel({ service, onSelect, onRemove }: PhotoreactionsPanelProps) {
  const initialRecords = service.search();
  const [records, setRecords] = useState<PhotoreactionsRecord[]>(initialRecords);
  const [message, setMessage] = useState(`${initialRecords.length} photo reactions`);


  const remove = (id: string) => {
    const response = handlePhotoreactions(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: PhotoreactionsRequest = { action: 'list' };
    const response = handlePhotoreactions(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} photo reactions`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };


  return (
    <View accessibilityLabel="photoReactions-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.photoId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
