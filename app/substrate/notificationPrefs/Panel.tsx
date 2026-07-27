import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleNotificationprefs, type NotificationprefsRequest } from './handler';
import { NotificationprefsService } from './service';
import type { NotificationprefsRecord } from './persistence';

export type NotificationprefsPanelProps = {
  service: NotificationprefsService;
  onSelect?: (record: NotificationprefsRecord) => void;
  onRemove?: (id: string) => void;
};

export function NotificationprefsPanel({ service, onSelect, onRemove }: NotificationprefsPanelProps) {
  const initialRecords = service.search();
  const [records, setRecords] = useState<NotificationprefsRecord[]>(initialRecords);
  const [message, setMessage] = useState(`${initialRecords.length} notification preferences`);


  const remove = (id: string) => {
    const response = handleNotificationprefs(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: NotificationprefsRequest = { action: 'list' };
    const response = handleNotificationprefs(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} notification preferences`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };


  return (
    <View accessibilityLabel="notificationPrefs-panel">
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
