import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { handleTimelineentries, type TimelineentriesRequest } from './handler';
import { TimelineentriesService } from './service';
import type { TimelineentriesRecord } from './persistence';

export type TimelineentriesPanelProps = {
  service: TimelineentriesService;
  onSelect?: (record: TimelineentriesRecord) => void;
  onRemove?: (id: string) => void;
};

export function TimelineentriesPanel({ service, onSelect, onRemove }: TimelineentriesPanelProps) {
  const initialRecords = service.search();
  const [records, setRecords] = useState<TimelineentriesRecord[]>(initialRecords);
  const [message, setMessage] = useState(`${initialRecords.length} timeline entries`);


  const remove = (id: string) => {
    const response = handleTimelineentries(service, { action: 'delete', id });
    if (response.status === 200) refresh();
  };

  const refresh = () => {
    const request: TimelineentriesRequest = { action: 'list' };
    const response = handleTimelineentries(service, request);
    if (response.status === 200 && Array.isArray(response.data)) {
      setRecords(response.data);
      setMessage(`${response.data.length} timeline entries`);
    } else {
      setMessage(response.error || 'Unable to load');
    }
  };


  return (
    <View accessibilityLabel="timelineEntries-panel">
      <Text testID="summary">{message}</Text>
      <Text testID="count">Count: {records.length}</Text>
      {records.length === 0 && <Text>No records</Text>}
      <Button title="Refresh" onPress={refresh} />
      {records.map((record) => (
        <View key={record.id}><Button title={record.entryId} onPress={() => onSelect?.(record)} /><Button title={`Remove ${record.id}`} onPress={() => { remove(record.id); onRemove?.(record.id); }} /></View>
      ))}
    </View>
  );
}
