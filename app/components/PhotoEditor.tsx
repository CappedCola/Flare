import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
// Note: Slider implementation simplified for now
import { useTheme } from '@ui-kitten/components';
import {
  Crop,
  Sun,
  Contrast,
  Palette,
  RotateCw,
  Zap,
} from 'lucide-react-native';

interface PhotoEditorProps {
  onFilterChange?: (filter: string) => void;
  onBrightnessChange?: (brightness: number) => void;
  onContrastChange?: (contrast: number) => void;
  onRotate?: () => void;
  onCrop?: () => void;
}

interface FilterOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  preview?: string;
}

export const PhotoEditor = ({
  onFilterChange,
  onBrightnessChange,
  onContrastChange,
  onRotate,
  onCrop,
}: PhotoEditorProps) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'filters' | 'adjust' | 'crop'>('filters');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const filters: FilterOption[] = [
    { id: 'none', name: 'Original', icon: <Zap size={16} color={theme['text-primary-color']} /> },
    { id: 'bw', name: 'B&W', icon: <Palette size={16} color={theme['text-primary-color']} /> },
    { id: 'vintage', name: 'Vintage', icon: <Palette size={16} color={theme['text-primary-color']} /> },
    { id: 'bright', name: 'Bright', icon: <Sun size={16} color={theme['text-primary-color']} /> },
    { id: 'dramatic', name: 'Dramatic', icon: <Contrast size={16} color={theme['text-primary-color']} /> },
  ];

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
    onFilterChange?.(filterId);
  };

  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    onBrightnessChange?.(value);
  };

  const handleContrastChange = (value: number) => {
    setContrast(value);
    onContrastChange?.(value);
  };

  const renderFilters = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterButton,
            { backgroundColor: theme['background-basic-color-2'] },
            selectedFilter === filter.id && { backgroundColor: theme['color-primary-500'] }
          ]}
          onPress={() => handleFilterSelect(filter.id)}
        >
          {filter.icon}
          <Text style={[
            styles.filterText,
            { color: theme['text-primary-color'] },
            selectedFilter === filter.id && { color: '#FFFFFF' }
          ]}>
            {filter.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAdjustments = () => (
    <View style={styles.adjustmentsContainer}>
      <View style={styles.sliderGroup}>
        <View style={styles.sliderHeader}>
          <Sun size={16} color={theme['text-primary-color']} />
          <Text style={[styles.sliderLabel, { color: theme['text-primary-color'] }]}>
            Brightness
          </Text>
          <Text style={[styles.sliderValue, { color: theme['text-hint-color'] }]}>
            {Math.round(brightness)}
          </Text>
        </View>
        <TouchableOpacity style={[styles.sliderPlaceholder, { backgroundColor: theme['background-basic-color-2'] }]}>
          <Text style={[styles.sliderPlaceholderText, { color: theme['text-hint-color'] }]}>
            Slider implementation pending
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sliderGroup}>
        <View style={styles.sliderHeader}>
          <Contrast size={16} color={theme['text-primary-color']} />
          <Text style={[styles.sliderLabel, { color: theme['text-primary-color'] }]}>
            Contrast
          </Text>
          <Text style={[styles.sliderValue, { color: theme['text-hint-color'] }]}>
            {Math.round(contrast)}
          </Text>
        </View>
        <TouchableOpacity style={[styles.sliderPlaceholder, { backgroundColor: theme['background-basic-color-2'] }]}>
          <Text style={[styles.sliderPlaceholderText, { color: theme['text-hint-color'] }]}>
            Slider implementation pending
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCropTools = () => (
    <View style={styles.cropContainer}>
      <TouchableOpacity
        style={[styles.cropButton, { backgroundColor: theme['background-basic-color-2'] }]}
        onPress={onCrop}
      >
        <Crop size={20} color={theme['text-primary-color']} />
        <Text style={[styles.cropButtonText, { color: theme['text-primary-color'] }]}>
          Crop
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.cropButton, { backgroundColor: theme['background-basic-color-2'] }]}
        onPress={onRotate}
      >
        <RotateCw size={20} color={theme['text-primary-color']} />
        <Text style={[styles.cropButtonText, { color: theme['text-primary-color'] }]}>
          Rotate
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'filters' && { borderBottomColor: theme['color-primary-500'] }
          ]}
          onPress={() => setActiveTab('filters')}
        >
          <Text style={[
            styles.tabText,
            { color: theme['text-primary-color'] },
            activeTab === 'filters' && { color: theme['color-primary-500'] }
          ]}>
            Filters
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'adjust' && { borderBottomColor: theme['color-primary-500'] }
          ]}
          onPress={() => setActiveTab('adjust')}
        >
          <Text style={[
            styles.tabText,
            { color: theme['text-primary-color'] },
            activeTab === 'adjust' && { color: theme['color-primary-500'] }
          ]}>
            Adjust
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'crop' && { borderBottomColor: theme['color-primary-500'] }
          ]}
          onPress={() => setActiveTab('crop')}
        >
          <Text style={[
            styles.tabText,
            { color: theme['text-primary-color'] },
            activeTab === 'crop' && { color: theme['color-primary-500'] }
          ]}>
            Crop
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'filters' && renderFilters()}
        {activeTab === 'adjust' && renderAdjustments()}
        {activeTab === 'crop' && renderCropTools()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  adjustmentsContainer: {
    gap: 20,
  },
  sliderGroup: {
    gap: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },
  slider: {
    height: 40,
  },
  sliderPlaceholder: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderPlaceholderText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cropContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cropButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cropButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});