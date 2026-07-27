import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleMediadrafts, type MediadraftsRequest } from './handler';
import { MediadraftsService } from './service';
import type { MediadraftsRecord } from './persistence';

export type MediadraftsPanelProps = {
  service: MediadraftsService;
  onSelect?: (record: MediadraftsRecord) => void;
  onRemove?: (id: string) => void;
};

export function MediadraftsPanel({ service, onSelect, onRemove }: MediadraftsPanelProps) {
  const [records, setRecords] = useState<MediadraftsRecord[]>([]);
  const [message, setMessage] = useState('Loading');


  const remove = (id: string) => {
    const response = handleMediadrafts(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: MediadraftsRequest = { action: 'list' };
    const response = handleMediadrafts(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} media drafts`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };

  useEffect(() => { refresh(); }, [service]);

  return (
    <View accessibilityLabel="mediaDrafts-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.draftId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
