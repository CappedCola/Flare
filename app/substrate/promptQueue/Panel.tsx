import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handlePromptqueue, type PromptqueueRequest } from './handler';
import { PromptqueueService } from './service';
import type { PromptqueueRecord } from './persistence';

export type PromptqueuePanelProps = {
  service: PromptqueueService;
  onSelect?: (record: PromptqueueRecord) => void;
  onRemove?: (id: string) => void;
};

export function PromptqueuePanel({ service, onSelect, onRemove }: PromptqueuePanelProps) {
  const [records, setRecords] = useState<PromptqueueRecord[]>([]);
  const [message, setMessage] = useState('Loading');


  const remove = (id: string) => {
    const response = handlePromptqueue(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: PromptqueueRequest = { action: 'list' };
    const response = handlePromptqueue(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} prompt queue`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };

  useEffect(() => { refresh(); }, [service]);

  return (
    <View accessibilityLabel="promptQueue-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.promptId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
