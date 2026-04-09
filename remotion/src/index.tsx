// Remotion Studio entry point — points to the shared compositions in the Next.js src
// The tsconfig paths alias @/* to ../src/* so imports work correctly
export { RemotionRoot } from '@/remotion/Root';

import { registerRoot } from 'remotion';
import { RemotionRoot } from '@/remotion/Root';

registerRoot(RemotionRoot);
