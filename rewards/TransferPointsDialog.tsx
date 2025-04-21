import { useState } from "react";
import { useRewards } from "@/hooks/useRewards";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransferPointsDialogProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

const TransferPointsDialog = ({ trigger, onSuccess }: TransferPointsDialogProps) => {
  const { user } = useAuth();
  const { transferPoints, isTransferring } = useRewards();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availablePoints = user?.rewardPoints || 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const pointsNum = Number(points);

    if (!points) {
      newErrors.points = "Points amount is required";
    } else if (isNaN(pointsNum) || pointsNum <= 0) {
      newErrors.points = "Points must be a positive number";
    } else if (pointsNum > availablePoints) {
      newErrors.points = "You don't have enough points";
    }

    if (!recipientEmail) {
      newErrors.recipientEmail = "Recipient email is required";
    } else if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
      newErrors.recipientEmail = "Invalid email address";
    } else if (recipientEmail === user?.email) {
      newErrors.recipientEmail = "You cannot transfer points to yourself";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTransfer = async () => {
    if (!validateForm()) return;

    try {
      await transferPoints(Number(points), recipientEmail, description || `Points transfer to ${recipientEmail}`);
      
      setOpen(false);
      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  const resetForm = () => {
    setPoints("");
    setRecipientEmail("");
    setDescription("");
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Points</DialogTitle>
          <DialogDescription>
            Send your reward points to another StayChill user.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="points" className="text-right">
              Points
            </Label>
            <div className="col-span-3">
              <Input
                id="points"
                type="number"
                min="1"
                max={availablePoints}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="How many points to transfer"
              />
              {errors.points && (
                <p className="text-sm text-red-500 mt-1">{errors.points}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Available: {availablePoints} points
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipientEmail" className="text-right">
              Recipient
            </Label>
            <div className="col-span-3">
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Recipient's email address"
              />
              {errors.recipientEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.recipientEmail}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Message
            </Label>
            <Input
              id="description"
              className="col-span-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional message"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleTransfer} 
            disabled={isTransferring}
          >
            {isTransferring ? "Transferring..." : "Transfer Points"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferPointsDialog;