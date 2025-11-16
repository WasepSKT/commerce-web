import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function ComingSoonModal({
  open,
  onOpenChange,
  title = 'Coming Soon',
  description = 'Fitur ini sedang dalam pengembangan dan akan segera hadir.',
}: ComingSoonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-50 rounded-full p-4">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Mengerti
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
