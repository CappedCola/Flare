import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleOfflineoutbox, type OfflineoutboxRequest } from './handler';
import { OfflineoutboxService } from './service';
import type { OfflineoutboxRecord } from './persistence';

export type OfflineoutboxPanelProps = {
  service: OfflineoutboxService;
  onSelect?: (record: OfflineoutboxRecord) => void;
  onRemove?: (id: string) => void;
};

export function OfflineoutboxPanel({ service, onSelect, onRemove }: OfflineoutboxPanelProps) {
  const [records, setRecords] = useState<OfflineoutboxRecord[]>([]);
  const [message, setMessage] = useState('Loading');


  const remove = (id: string) => {
    const response = handleOfflineoutbox(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: OfflineoutboxRequest = { action: 'list' };
    const response = handleOfflineoutbox(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} offline outbox items`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };

  useEffect(() => { refresh(); }, [service]);

  return (
    <View accessibilityLabel="offlineOutbox-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.operationId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
