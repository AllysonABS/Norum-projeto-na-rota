import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {getQueue, removeFromQueue, OfflineAction} from './offlineQueue';
import {concluirEtapaPedido, atualizarStatusPedido, uploadFotoPedido, salvarObservacaoPedido} from './api';

type SyncListener = (status: 'syncing' | 'done' | 'error') => void;

let listener: SyncListener | null = null;
let isSyncing = false;

export function setSyncListener(fn: SyncListener | null) {
  listener = fn;
}

async function processAction(action: OfflineAction): Promise<boolean> {
  const {type, payload} = action;
  try {
    switch (type) {
      case 'concluir_etapa': {
        const res = await concluirEtapaPedido(payload.pedidoId, payload.tipo);
        return res.success;
      }
      case 'upload_foto': {
        const res = await uploadFotoPedido(payload.pedidoId, payload.uri, payload.etapa);
        return res.success;
      }
      case 'atualizar_status': {
        const res = await atualizarStatusPedido(payload.pedidoId, payload.status);
        return res.success;
      }
      case 'salvar_observacao': {
        const res = await salvarObservacaoPedido(payload.pedidoId, payload.observacao);
        return res.success;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export async function processQueue(): Promise<void> {
  if (isSyncing) return;
  const queue = await getQueue();
  if (queue.length === 0) return;

  isSyncing = true;
  listener?.('syncing');

  for (const action of queue) {
    const success = await processAction(action);
    if (success) {
      await removeFromQueue(action.id);
    } else {
      // Para na primeira falha — tenta de novo na próxima reconexão
      isSyncing = false;
      listener?.('error');
      return;
    }
  }

  isSyncing = false;
  listener?.('done');
}

let unsubscribe: (() => void) | null = null;

export function startSyncListener() {
  if (unsubscribe) return;
  unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      processQueue();
    }
  });
}

export function stopSyncListener() {
  unsubscribe?.();
  unsubscribe = null;
}
