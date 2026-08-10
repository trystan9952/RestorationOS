"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LOSS_TYPES,
  type Loss,
  type LossType,
} from "@/lib/domain/Loss";
import { useTwinStore } from "@/lib/store/useTwinStore";

type EditJobDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loss: Loss;
};

export function EditJobDialog({
  open,
  onOpenChange,
  loss,
}: EditJobDialogProps) {
  const updateLossDetails = useTwinStore((state) => state.updateLossDetails);
  const isUpdatingLoss = useTwinStore((state) => state.isUpdatingLoss);
  const lossError = useTwinStore((state) => state.lossError);
  const clearLossError = useTwinStore((state) => state.clearLossError);

  const [address, setAddress] = useState(loss.address);
  const [customer, setCustomer] = useState(loss.customer);
  const [phone, setPhone] = useState(loss.phone);
  const [insurance, setInsurance] = useState(loss.insurance);
  const [claimNumber, setClaimNumber] = useState(loss.claimNumber);
  const [lossType, setLossType] = useState<LossType>(loss.lossType);
  const [dateOfLoss, setDateOfLoss] = useState(loss.dateOfLoss);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setAddress(loss.address);
    setCustomer(loss.customer);
    setPhone(loss.phone);
    setInsurance(loss.insurance);
    setClaimNumber(loss.claimNumber);
    setLossType(loss.lossType);
    setDateOfLoss(loss.dateOfLoss);
    setFormError(null);
    clearLossError();
  }, [clearLossError, loss, open]);

  const canSave = useMemo(() => {
    return (
      address.trim().length > 0 &&
      customer.trim().length > 0 &&
      lossType.trim().length > 0 &&
      dateOfLoss.trim().length > 0
    );
  }, [address, customer, dateOfLoss, lossType]);

  async function handleSave() {
    if (isUpdatingLoss) {
      return;
    }

    const trimmedAddress = address.trim();
    const trimmedCustomer = customer.trim();
    const trimmedDate = dateOfLoss.trim();

    if (!trimmedAddress || !trimmedCustomer || !lossType || !trimmedDate) {
      setFormError(
        "Property address, customer name, loss type, and date of loss are required."
      );
      return;
    }

    setFormError(null);
    clearLossError();

    try {
      await updateLossDetails({
        address: trimmedAddress,
        customer: trimmedCustomer,
        phone: phone.trim(),
        insurance: insurance.trim(),
        claimNumber: claimNumber.trim(),
        lossType,
        dateOfLoss: trimmedDate,
      });
      onOpenChange(false);
    } catch {
      // lossError is set in the store
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!isUpdatingLoss}
        className="max-h-[90vh] overflow-y-auto bg-slate-900 text-white ring-slate-700 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-white">Edit Job</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="edit-address" className="text-sm text-slate-300">
              Property Address
            </label>
            <Input
              id="edit-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              disabled={isUpdatingLoss}
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="edit-customer" className="text-sm text-slate-300">
              Customer Name
            </label>
            <Input
              id="edit-customer"
              value={customer}
              onChange={(event) => setCustomer(event.target.value)}
              disabled={isUpdatingLoss}
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="edit-phone" className="text-sm text-slate-300">
              Phone Number
            </label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={isUpdatingLoss}
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="edit-insurance" className="text-sm text-slate-300">
              Insurance Company
            </label>
            <Input
              id="edit-insurance"
              value={insurance}
              onChange={(event) => setInsurance(event.target.value)}
              disabled={isUpdatingLoss}
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="edit-claim" className="text-sm text-slate-300">
              Claim Number
            </label>
            <Input
              id="edit-claim"
              value={claimNumber}
              onChange={(event) => setClaimNumber(event.target.value)}
              disabled={isUpdatingLoss}
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="edit-loss-type" className="text-sm text-slate-300">
              Loss Type
            </label>
            <select
              id="edit-loss-type"
              value={lossType}
              onChange={(event) => setLossType(event.target.value as LossType)}
              disabled={isUpdatingLoss}
              className="h-8 rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-sm text-white outline-none"
            >
              {LOSS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="edit-date-of-loss" className="text-sm text-slate-300">
              Date of Loss
            </label>
            <Input
              id="edit-date-of-loss"
              type="date"
              value={dateOfLoss}
              onChange={(event) => setDateOfLoss(event.target.value)}
              disabled={isUpdatingLoss}
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>

          {(formError || lossError) && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {formError ?? lossError}
            </p>
          )}
        </div>

        <DialogFooter className="border-slate-800 bg-slate-950/60">
          <DialogClose
            disabled={isUpdatingLoss}
            render={<Button variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button
            onClick={() => void handleSave()}
            disabled={!canSave || isUpdatingLoss}
          >
            {isUpdatingLoss ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
