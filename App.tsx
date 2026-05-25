import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HomeScreen } from './screens/HomeScreen';
import { StageScreen } from './screens/StageScreen';
import { useStageStore } from './src/store/useStageStore';
import { VenueId } from './src/types';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'stage'>('home');
  const setVenue = useStageStore((s) => s.setVenue);

  const handleSelectVenue = (id: VenueId) => {
    setVenue(id);
    setScreen('stage');
  };

  const handleBack = () => {
    setScreen('home');
  };

  if (screen === 'stage') {
    return <StageScreen onBack={handleBack} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HomeScreen onSelectVenue={handleSelectVenue} />
    </GestureHandlerRootView>
  );
}
