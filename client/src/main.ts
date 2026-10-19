// 담당: D (화면 전환). C·E 모듈은 Round 2 에서 여기서 연결한다.
import './style.css';
import { renderLobby } from './screens/lobby';

export type Screen = 'lobby' | 'room' | 'countdown' | 'game' | 'result';

const root = document.querySelector<HTMLDivElement>('#app')!;
let screen: Screen = 'lobby';

function render(): void {
  root.innerHTML = '';
  switch (screen) {
    case 'lobby':
      renderLobby(root);
      break;
    default:
      // TODO(F-08, F-10): room / countdown / game / result
      root.textContent = `TODO: ${screen}`;
  }
}

render();
