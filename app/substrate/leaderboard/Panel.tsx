import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleLeaderboard, type LeaderboardRequest } from './handler';
import { LeaderboardService } from './service';
import type { LeaderboardRecord } from './persistence';

export type LeaderboardPanelProps = {
  service: LeaderboardService;
  onSelect?: (record: LeaderboardRecord) => void;
  onRemove?: (id: string) => void;
};

export function LeaderboardPanel({ service, onSelect, onRemove }: LeaderboardPanelProps) {
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [message, setMessage] = useState('Loading');


  const remove = (id: string) => {
    const response = handleLeaderboard(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: LeaderboardRequest = { action: 'list' };
    const response = handleLeaderboard(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} leaderboard entries`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };

  useEffect(() => { refresh(); }, [service]);

  return (
    <View accessibilityLabel="leaderboard-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.season} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
