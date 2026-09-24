'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IndianRupee, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export function SetCoursePriceButton({ courseId, currentPrice }: { courseId: string; currentPrice?: number | null }) {
  const [price, setPrice] = useState(currentPrice ? (currentPrice / 100).toString() : '');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new Error('Please enter a valid positive number');
      }

      const priceInPaise = Math.round(parsedPrice * 100);

      const res = await fetch(`/api/courses/${courseId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: priceInPaise }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update price');
      }

      toast({
        title: 'Price Updated',
        description: `Course price set to ₹${parsedPrice.toFixed(2)}`,
      });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full sm:w-auto font-medium" type="button">
            <IndianRupee className="w-4 h-4 mr-2" />
            {currentPrice ? `₹${(currentPrice / 100).toFixed(2)}` : 'Set Price (Free)'}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Course Price</DialogTitle>
          <DialogDescription>
            Enter the price for this course in INR (₹). Setting this to 0 will make the course free.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="pl-9"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Price
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
