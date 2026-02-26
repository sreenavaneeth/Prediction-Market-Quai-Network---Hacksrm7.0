import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getExplorerTxUrl } from '../utils';

export function TransactionToast({ txHash, status, onClose }) {
  if (!txHash) return null;

  const explorerUrl = getExplorerTxUrl(txHash);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-card border border-white/10 rounded-xl p-4 shadow-2xl min-w-[320px]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {status === 'pending' && (
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="w-6 h-6 text-success" />
              )}
              {status === 'failed' && (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">
                {status === 'pending' && 'Transaction Pending'}
                {status === 'success' && 'Transaction Confirmed'}
                {status === 'failed' && 'Transaction Failed'}
              </p>
              <p className="text-sm text-muted-foreground truncate mt-1">
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
              
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline mt-2"
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
