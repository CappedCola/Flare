import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleRoomaccess, type RoomaccessRequest } from './handler';
import { RoomaccessService } from './service';
import type { RoomaccessRecord } from './persistence';

export type RoomaccessPanelProps = {
  service: RoomaccessService;
  onSelect?: (record: RoomaccessRecord) => void;
  onRemove?: (id: string) => void;
};

export function RoomaccessPanel({ service, onSelect, onRemove }: RoomaccessPanelProps) {
  const initialRecords = service.search();
  const [records, setRecords] = useState<RoomaccessRecord[]>(initialRecords);
  const [message, setMessage] = useState(`${initialRecords.length} room access grants`);


  const remove = (id: string) => {
    const response = handleRoomaccess(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: RoomaccessRequest = { action: 'list' };
    const response = handleRoomaccess(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} room access grants`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };


  return (
    <View accessibilityLabel="roomAccess-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.roomId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
