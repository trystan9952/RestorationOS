"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTwinStore } from "@/lib/store/useTwinStore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function RoomsPage() {
  const rooms = useTwinStore((state) => state.rooms);
  const addRoom = useTwinStore((state) => state.addRoom);
  const hydrateFromDatabase = useTwinStore((state) => state.hydrateFromDatabase);

  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    void hydrateFromDatabase();
  }, [hydrateFromDatabase]);

  function resetForm() {
    setRoomName("");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  }

  async function handleSave() {
    const name = roomName.trim();

    if (!name) return;

    await addRoom(name);

    setOpen(false);
    resetForm();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            Rooms
          </h1>

          <Button onClick={() => setOpen(true)}>
            Add Room
          </Button>
        </header>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Room</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <label
                htmlFor="room-name"
                className="text-sm font-medium"
              >
                Room Name
              </label>

              <Input
                id="room-name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Kitchen"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>

              <Button onClick={handleSave} disabled={!roomName.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {rooms.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed">
            <p className="text-muted-foreground">
              No rooms added yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Link key={room.id} href={`/room/${room.id}`}>
                <Card className="cursor-pointer transition-all hover:border-blue-500 hover:shadow-lg hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle>{room.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}