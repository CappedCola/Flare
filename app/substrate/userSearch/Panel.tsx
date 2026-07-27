import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleUsersearch, type UsersearchRequest } from './handler';
import { UsersearchService } from './service';
import type { UsersearchRecord } from './persistence';

export type UsersearchPanelProps = {
  service: UsersearchService;
  onSelect?: (record: UsersearchRecord) => void;
  onRemove?: (id: string) => void;
};

export function UsersearchPanel({ service, onSelect, onRemove }: UsersearchPanelProps) {
  const [records, setRecords] = useState<UsersearchRecord[]>([]);
  const [message, setMessage] = useState('Loading');


  const remove = (id: string) => {
    const response = handleUsersearch(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: UsersearchRequest = { action: 'list' };
    const response = handleUsersearch(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} user search entries`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };

  useEffect(() => { refresh(); }, [service]);

  return (
    <View accessibilityLabel="userSearch-panel">
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
