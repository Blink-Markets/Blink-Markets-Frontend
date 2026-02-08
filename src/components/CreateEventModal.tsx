import { useState } from 'react';
import { useDAppKit, useCurrentAccount } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { X, Plus, Clock } from 'lucide-react';
import { PACKAGE_ID, MARKET_ID } from '../lib/constants';
import { useCurrentClient } from '@mysten/dapp-kit-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEventModal = ({ isOpen, onClose }: CreateEventModalProps) => {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  
  const [description, setDescription] = useState('');
  const [outcomeA, setOutcomeA] = useState('Yes');
  const [outcomeB, setOutcomeB] = useState('No');
  const [duration, setDuration] = useState('5'); // minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const now = Date.now();
      const startTime = now;
      const endTime = now + (parseInt(duration) * 60 * 1000);

      console.log('Searching for MarketCreatorCap for:', account.address);
      console.log('Package ID:', PACKAGE_ID);

      // 1. Fetch the MarketCreatorCap from the user's wallet
      // We'll try to get all owned objects and find it manually to be more robust
      const ownedObjects = await client.getOwnedObjects({
        owner: account.address,
        options: {
          showType: true,
        },
      });

      console.log('Objects found:', ownedObjects.data.length);
      console.log('Object Types:', JSON.stringify(ownedObjects.data.map(o => o.data?.type), null, 2));

      const capObject = ownedObjects.data.find(obj => {
        const type = obj.data?.type;
        return type && (
          type.includes('::blink_config::MarketCreatorCap') || 
          type.includes('::market::MarketCreatorCap') || 
          type.includes('::blink_event::MarketCreatorCap')
        );
      });

      const creatorCapId = capObject?.data?.objectId;

      if (!creatorCapId) {
        throw new Error(`MarketCreatorCap not found. Checked ${ownedObjects.data.length} objects.`);
      }

      console.log('Found MarketCreatorCap:', creatorCapId);

      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::blink_event::create_event`,
        arguments: [
          tx.object(creatorCapId),
          tx.object(MARKET_ID!),
          tx.pure.string(description),
          tx.pure.vector('string', [outcomeA, outcomeB]),
          tx.pure.u64(startTime),
          tx.pure.u64(endTime),
        ],
      });

      await dAppKit.signAndExecuteTransaction({
        transaction: tx,
      });
      
      onClose();
    } catch (err) {
      console.error('Failed to create event:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('ETooManyOutcomes')) {
        setError('Too many outcomes specified.');
      } else if (errorMessage.includes('MarketCreatorCap not found')) {
        setError(errorMessage);
      } else {
        setError(`Failed to create event: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0D1B2A] border border-[#1B3B5F] rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Plus size={20} className="text-[#4DA2FF]" />
          Create New Event
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Event Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. BTC > $100k by 2025?"
              className="w-full bg-[#1B2B3F] border border-[#2B4B6F] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#4DA2FF]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Outcome A
              </label>
              <input
                type="text"
                value={outcomeA}
                onChange={(e) => setOutcomeA(e.target.value)}
                className="w-full bg-[#1B2B3F] border border-[#2B4B6F] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#4DA2FF]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Outcome B
              </label>
              <input
                type="text"
                value={outcomeB}
                onChange={(e) => setOutcomeB(e.target.value)}
                className="w-full bg-[#1B2B3F] border border-[#2B4B6F] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#4DA2FF]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Duration (minutes)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-[#1B2B3F] border border-[#2B4B6F] rounded-lg px-4 py-2 pl-10 text-white focus:outline-none focus:border-[#4DA2FF]"
                required
              />
              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            * You must have the MarketCreatorCap to create events.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !account}
            className="w-full mt-2 bg-[#4DA2FF] hover:bg-[#3B80CC] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Creating...' : 'Create On-Chain Event'}
          </button>
        </form>
      </div>
    </div>
  );
};
