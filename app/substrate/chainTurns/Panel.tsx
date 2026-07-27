import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleChainturns, type ChainturnsRequest } from './handler';
import { ChainturnsService } from './service';
import type { ChainturnsRecord } from './persistence';

export type ChainturnsPanelProps = {
  service: ChainturnsService;
  onSelect?: (record: ChainturnsRecord) => void;
  onRemove?: (id: string) => void;
};

export function ChainturnsPanel({ service, onSelect, onRemove }: ChainturnsPanelProps) {
  const initialRecords = service.search();
  const [records, setRecords] = useState<ChainturnsRecord[]>(initialRecords);
  const [message, setMessage] = useState(`${initialRecords.length} chain turns`);


  const remove = (id: string) => {
    const response = handleChainturns(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: ChainturnsRequest = { action: 'list' };
    const response = handleChainturns(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} chain turns`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };


  return (
    <View accessibilityLabel="chainTurns-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.chainId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
