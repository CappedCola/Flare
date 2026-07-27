import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleFriendinvites, type FriendinvitesRequest } from './handler';
import { FriendinvitesService } from './service';
import type { FriendinvitesRecord } from './persistence';

export type FriendinvitesPanelProps = {
  service: FriendinvitesService;
  onSelect?: (record: FriendinvitesRecord) => void;
  onRemove?: (id: string) => void;
};

export function FriendinvitesPanel({ service, onSelect, onRemove }: FriendinvitesPanelProps) {
  const [records, setRecords] = useState<FriendinvitesRecord[]>([]);
  const [message, setMessage] = useState('Loading');


  const remove = (id: string) => {
    const response = handleFriendinvites(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: FriendinvitesRequest = { action: 'list' };
    const response = handleFriendinvites(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} friend invites`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };

  useEffect(() => { refresh(); }, [service]);

  return (
    <View accessibilityLabel="friendInvites-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.inviteId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
