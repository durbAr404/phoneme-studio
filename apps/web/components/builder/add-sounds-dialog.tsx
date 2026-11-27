"use client";
import { useEffect, useState } from "react";
import { Undo2 } from "lucide-react";
import { Button, Dialog, Input } from "@/components/ui";
import { PhonemeTiles, SoundKeyboard } from "@/components/phoneme/keys";

/** Enter the sounds for a word that isn't in the library, using the sound keyboard. */
export function AddSoundsDialog({ word, onClose, onSave }: { word: string | null; onClose: () => void; onSave: (english: string, phonemes: string[]) => void }) {
  const [english, setEnglish] = useState("");
  const [sounds, setSounds] = useState<string[]>([]);

  useEffect(() => {
    setEnglish(word ?? "");
    setSounds([]);
  }, [word]);

  return (
    <Dialog open={word !== null} onClose={onClose} title="Add the sounds" wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="add-word" className="mb-1.5 block text-[15px] font-medium">Word</label>
            <Input id="add-word" value={english} onChange={(e) => setEnglish(e.target.value)} />
          </div>
        </div>
        <div className="flex min-h-16 items-center gap-3 rounded-2xl bg-sunken p-3">
          {sounds.length ? <PhonemeTiles phonemes={sounds} size="md" /> : <span className="text-ink-soft">Tap sounds below</span>}
          {sounds.length > 0 && (
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSounds(sounds.slice(0, -1))}>
              <Undo2 className="size-4" /> Undo
            </Button>
          )}
        </div>
        <SoundKeyboard onPress={(s) => sounds.length < 12 && setSounds([...sounds, s])} />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!english.trim() || !sounds.length} onClick={() => onSave(english.trim().toLowerCase(), sounds)}>
            Save word
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
