import { registerRootComponent } from 'expo';
import { CHALLENGES } from './challenges';

import App from './App';

// Log challenges to verify
console.log('Challenges Around Me:', CHALLENGES);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
