import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleChatthreads, type ChatthreadsRequest } from './handler';
import { ChatthreadsService } from './service';
import type { ChatthreadsRecord } from './persistence';

export type ChatthreadsPanelProps = {
  service: ChatthreadsService;
  onSelect?: (record: ChatthreadsRecord) => void;
  onRemove?: (id: string) => void;
};

export function ChatthreadsPanel({ service, onSelect, onRemove }: ChatthreadsPanelProps) {
  const initialRecords = service.search();
  const [records, setRecords] = useState<ChatthreadsRecord[]>(initialRecords);
  const [message, setMessage] = useState(`${initialRecords.length} chat threads`);


  const remove = (id: string) => {
    const response = handleChatthreads(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: ChatthreadsRequest = { action: 'list' };
    const response = handleChatthreads(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} chat threads`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };


  return (
    <View accessibilityLabel="chatThreads-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.threadId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
