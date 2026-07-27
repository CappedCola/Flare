import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleDiscoveryfilters, type DiscoveryfiltersRequest } from './handler';
import { DiscoveryfiltersService } from './service';
import type { DiscoveryfiltersRecord } from './persistence';

export type DiscoveryfiltersPanelProps = {
  service: DiscoveryfiltersService;
  onSelect?: (record: DiscoveryfiltersRecord) => void;
  onRemove?: (id: string) => void;
};

export function DiscoveryfiltersPanel({ service, onSelect, onRemove }: DiscoveryfiltersPanelProps) {
  const initialRecords = service.search();
  const [records, setRecords] = useState<DiscoveryfiltersRecord[]>(initialRecords);
  const [message, setMessage] = useState(`${initialRecords.length} discovery filters`);


  const remove = (id: string) => {
    const response = handleDiscoveryfilters(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: DiscoveryfiltersRequest = { action: 'list' };
    const response = handleDiscoveryfilters(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} discovery filters`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };


  return (
    <View accessibilityLabel="discoveryFilters-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.query} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
