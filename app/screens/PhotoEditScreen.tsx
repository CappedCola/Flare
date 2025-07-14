import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  PanGestureHandler,
  State,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@ui-kitten/components';
import {
  ArrowLeft,
  RotateCcw,
  Check,
  Crop,
  Sun,
  Type,
  Smile,
  Palette,
  Undo,
  Redo,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation as useNavigationContext } from '../context/NavigationContext';

interface PhotoEditScreenProps {
  navigation: any;
  route: {
    params: {
      photoUri: string;
      photoOrientation?: 'portrait' | 'landscape';
    };
  };
}

interface EditAction {
  id: string;
  type: 'filter' | 'crop' | 'sticker' | 'text';
  data: any;
}

export const PhotoEditScreen = ({ navigation, route }: PhotoEditScreenProps) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { hideNavigation, showNavigation } = useNavigationContext();
  const { photoUri, photoOrientation = 'portrait' } = route.params;
  
  const [editHistory, setEditHistory] = useState<EditAction[]>([]);
  const [currentEditIndex, setCurrentEditIndex] = useState(-1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>('none');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  
  // Hide navigation when this screen is active
  React.useEffect(() => {
    hideNavigation();
    
    return () => {
      showNavigation();
    };
  }, [hideNavigation, showNavigation]);
  
  const handleBack = () => {
    showNavigation();
    navigation.goBack();
  };
  
  const handleSave = () => {
    // Navigate to PhotoSendScreen with edited photo
    navigation.navigate('PhotoSend', {
      photoUri: photoUri, // In real implementation, this would be the edited photo URI
      photoOrientation: photoOrientation
    });
  };
  
  const addEditAction = (action: EditAction) => {
    const newHistory = editHistory.slice(0, currentEditIndex + 1);
    newHistory.push(action);
    setEditHistory(newHistory);
    setCurrentEditIndex(newHistory.length - 1);
  };
  
  const undo = () => {
    if (currentEditIndex >= 0) {
      setCurrentEditIndex(currentEditIndex - 1);
    }
  };
  
  const redo = () => {
    if (currentEditIndex < editHistory.length - 1) {
      setCurrentEditIndex(currentEditIndex + 1);
    }
  };
  
  const applyFilter = (filterName: string) => {
    setCurrentFilter(filterName);
    addEditAction({
      id: Date.now().toString(),
      type: 'filter',
      data: { filterName }
    });
  };
  
  const adjustBrightness = (value: number) => {
    setBrightness(value);
    addEditAction({
      id: Date.now().toString(),
      type: 'filter',
      data: { brightness: value }
    });
  };
  
  const FilterPicker = () => {
    const filters = [
      { name: 'none', label: 'Original' },
      { name: 'vintage', label: 'Vintage' },
      { name: 'bw', label: 'B&W' },
      { name: 'sepia', label: 'Sepia' },
      { name: 'vivid', label: 'Vivid' },
      { name: 'cool', label: 'Cool' },
    ];
    
    return (
      <View style={styles.toolPanel}>
        <Text style={[styles.toolTitle, { color: theme['text-primary-color'] }]}>
          Filters
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.name}
              style={[
                styles.filterOption,
                currentFilter === filter.name && styles.filterOptionSelected
              ]}
              onPress={() => applyFilter(filter.name)}
            >
              <View style={[
                styles.filterPreview,
                { backgroundColor: getFilterColor(filter.name) }
              ]} />
              <Text style={[
                styles.filterLabel,
                { color: theme['text-primary-color'] },
                currentFilter === filter.name && styles.filterLabelSelected
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  const getFilterColor = (filterName: string): string => {
    switch (filterName) {
      case 'vintage': return '#D2B48C';
      case 'bw': return '#888888';
      case 'sepia': return '#704214';
      case 'vivid': return '#FF6B6B';
      case 'cool': return '#4ECDC4';
      default: return '#E0E0E0';
    }
  };
  
  const CropTool = () => (
    <View style={styles.toolPanel}>
      <Text style={[styles.toolTitle, { color: theme['text-primary-color'] }]}>
        Crop
      </Text>
      <View style={styles.cropOptions}>
        <TouchableOpacity style={styles.cropOption}>
          <Text style={[styles.cropLabel, { color: theme['text-primary-color'] }]}>Square</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cropOption}>
          <Text style={[styles.cropLabel, { color: theme['text-primary-color'] }]}>4:3</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cropOption}>
          <Text style={[styles.cropLabel, { color: theme['text-primary-color'] }]}>16:9</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cropOption}>
          <Text style={[styles.cropLabel, { color: theme['text-primary-color'] }]}>Free</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const StickerPicker = () => {
    const stickers = ['😀', '😎', '🔥', '❤️', '✨', '🎉', '🌟', '💯'];
    
    return (
      <View style={styles.toolPanel}>
        <Text style={[styles.toolTitle, { color: theme['text-primary-color'] }]}>
          Stickers
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {stickers.map((sticker, index) => (
            <TouchableOpacity
              key={index}
              style={styles.stickerOption}
              onPress={() => {
                addEditAction({
                  id: Date.now().toString(),
                  type: 'sticker',
                  data: { emoji: sticker }
                });
              }}
            >
              <Text style={styles.stickerEmoji}>{sticker}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  const TextTool = () => (
    <View style={styles.toolPanel}>
      <Text style={[styles.toolTitle, { color: theme['text-primary-color'] }]}>
        Add Text
      </Text>
      <TouchableOpacity 
        style={[styles.addTextButton, { backgroundColor: theme['color-primary-500'] }]}
        onPress={() => {
          addEditAction({
            id: Date.now().toString(),
            type: 'text',
            data: { text: 'Tap to edit', color: '#FFFFFF', size: 24 }
          });
        }}
      >
        <Type size={20} color="#FFFFFF" />
        <Text style={styles.addTextLabel}>Add Text</Text>
      </TouchableOpacity>
    </View>
  );
  
  const AdjustmentTool = () => (
    <View style={styles.toolPanel}>
      <Text style={[styles.toolTitle, { color: theme['text-primary-color'] }]}>
        Adjustments
      </Text>
      <View style={styles.adjustmentControls}>
        <View style={styles.adjustmentRow}>
          <Text style={[styles.adjustmentLabel, { color: theme['text-primary-color'] }]}>
            Brightness
          </Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity onPress={() => adjustBrightness(brightness - 10)}>
              <Text style={styles.sliderButton}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.sliderValue, { color: theme['text-primary-color'] }]}>
              {brightness}
            </Text>
            <TouchableOpacity onPress={() => adjustBrightness(brightness + 10)}>
              <Text style={styles.sliderButton}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
  
  const renderToolPanel = () => {
    switch (selectedTool) {
      case 'filters':
        return <FilterPicker />;
      case 'crop':
        return <CropTool />;
      case 'stickers':
        return <StickerPicker />;
      case 'text':
        return <TextTool />;
      case 'adjust':
        return <AdjustmentTool />;
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme['border-basic-color-2'] }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme['text-primary-color']} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme['text-primary-color'] }]}>
          Edit Photo
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={undo}
            disabled={currentEditIndex < 0}
          >
            <Undo 
              size={20} 
              color={currentEditIndex >= 0 ? theme['text-primary-color'] : theme['text-hint-color']} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={redo}
            disabled={currentEditIndex >= editHistory.length - 1}
          >
            <Redo 
              size={20} 
              color={currentEditIndex < editHistory.length - 1 ? theme['text-primary-color'] : theme['text-hint-color']} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Photo Preview */}
      <View style={styles.photoContainer}>
        <Image 
          source={{ uri: `file://${photoUri}` }} 
          style={[
            styles.photo,
            photoOrientation === 'landscape' && styles.photoLandscape
          ]}
          resizeMode="contain"
        />
      </View>
      
      {/* Tool Panel */}
      {selectedTool && (
        <View style={[styles.toolPanelContainer, { backgroundColor: theme['background-basic-color-2'] }]}>
          {renderToolPanel()}
        </View>
      )}
      
      {/* Bottom Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: theme['background-basic-color-2'] }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
          <TouchableOpacity 
            style={[styles.toolButton, selectedTool === 'filters' && styles.toolButtonActive]}
            onPress={() => setSelectedTool(selectedTool === 'filters' ? null : 'filters')}
          >
            <Palette size={24} color={selectedTool === 'filters' ? '#FF4D4D' : theme['text-primary-color']} />
            <Text style={[
              styles.toolLabel, 
              { color: selectedTool === 'filters' ? '#FF4D4D' : theme['text-primary-color'] }
            ]}>
              Filters
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolButton, selectedTool === 'crop' && styles.toolButtonActive]}
            onPress={() => setSelectedTool(selectedTool === 'crop' ? null : 'crop')}
          >
            <Crop size={24} color={selectedTool === 'crop' ? '#FF4D4D' : theme['text-primary-color']} />
            <Text style={[
              styles.toolLabel, 
              { color: selectedTool === 'crop' ? '#FF4D4D' : theme['text-primary-color'] }
            ]}>
              Crop
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolButton, selectedTool === 'adjust' && styles.toolButtonActive]}
            onPress={() => setSelectedTool(selectedTool === 'adjust' ? null : 'adjust')}
          >
            <Sun size={24} color={selectedTool === 'adjust' ? '#FF4D4D' : theme['text-primary-color']} />
            <Text style={[
              styles.toolLabel, 
              { color: selectedTool === 'adjust' ? '#FF4D4D' : theme['text-primary-color'] }
            ]}>
              Adjust
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolButton, selectedTool === 'text' && styles.toolButtonActive]}
            onPress={() => setSelectedTool(selectedTool === 'text' ? null : 'text')}
          >
            <Type size={24} color={selectedTool === 'text' ? '#FF4D4D' : theme['text-primary-color']} />
            <Text style={[
              styles.toolLabel, 
              { color: selectedTool === 'text' ? '#FF4D4D' : theme['text-primary-color'] }
            ]}>
              Text
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolButton, selectedTool === 'stickers' && styles.toolButtonActive]}
            onPress={() => setSelectedTool(selectedTool === 'stickers' ? null : 'stickers')}
          >
            <Smile size={24} color={selectedTool === 'stickers' ? '#FF4D4D' : theme['text-primary-color']} />
            <Text style={[
              styles.toolLabel, 
              { color: selectedTool === 'stickers' ? '#FF4D4D' : theme['text-primary-color'] }
            ]}>
              Stickers
            </Text>
          </TouchableOpacity>
        </ScrollView>
        
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#FF4D4D' }]}
          onPress={handleSave}
        >
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerAction: {
    padding: 4,
  },
  photoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  photo: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 1.33,
    borderRadius: 12,
  },
  photoLandscape: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 0.75,
  },
  toolPanelContainer: {
    maxHeight: screenHeight * 0.3,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  toolPanel: {
    padding: 16,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOption: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
  },
  filterOptionSelected: {
    transform: [{ scale: 0.95 }],
  },
  filterPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterLabelSelected: {
    color: '#FF4D4D',
    fontWeight: '600',
  },
  cropOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  cropOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cropLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  stickerOption: {
    marginRight: 16,
    paddingVertical: 8,
  },
  stickerEmoji: {
    fontSize: 32,
  },
  addTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
  },
  addTextLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  adjustmentControls: {
    gap: 16,
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjustmentLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sliderButton: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF4D4D',
    width: 30,
    textAlign: 'center',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingRight: 16,
  },
  toolButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toolButtonActive: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});