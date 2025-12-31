import React, { useMemo, useState } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { InfoIcon, TrashIcon } from "lucide-react";
import { Check } from "lucide-react";

interface PostingBalancingDeviationSelectorProps {
  value: Record<string, number>;
  setValue: (val: Record<string, number>) => void;
  postings: string[];
}

const MAX_THRESHOLD = 15;

const PostingBalancingDeviationSelector: React.FC<
  PostingBalancingDeviationSelectorProps
> = ({ value, setValue, postings }) => {
  const [open, setOpen] = useState(false);
  const [selectedPostings, setSelectedPostings] = useState<string[]>([]);
  const [threshold, setThreshold] = useState<number>(1);
  const [showDropdown, setShowDropdown] = useState(false);

  const configuredPostings = Object.keys(value);

  const availablePostings = useMemo(() => {
    const hasShared =
      "GRM+MedComm (TTSH)" in value;

    const hasIndividualGRM =
      "GRM (TTSH)" in value || "MedComm (TTSH)" in value;

    return postings
      .filter((p) => {
        if (p in value) return false;

        // hide individual GRM/MedComm if shared exists
        if (hasShared && (p === "GRM (TTSH)" || p === "MedComm (TTSH)"))
          return false;

        return true;
      })
      .concat(
        hasShared || hasIndividualGRM
          ? []
          : ["GRM+MedComm (TTSH)"]
      )
      .sort();
  }, [postings, value]);

  const handleAdd = (): void => {
    if (selectedPostings.length === 0) return;

    const next = { ...value };

    selectedPostings.forEach((posting) => {
      if (posting === "GRM (TTSH)" || posting === "MedComm (TTSH)") {
        next["GRM+MedComm (TTSH)"] = threshold;
        return;
      }

      next[posting] = threshold;
    });

    setValue(next);
    setSelectedPostings([]);
    setThreshold(1);
    setShowDropdown(false);
  };

  const handleUpdate =
    (posting: string) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const raw = Number(e.target.value);
      const sanitized = Math.max(
        0,
        Math.min(MAX_THRESHOLD, Number.isFinite(raw) ? raw : 0)
      );

      setValue({ ...value, [posting]: sanitized });
    };

  const handleRemove = (posting: string): void => {
    const next = { ...value };
    delete next[posting];
    setValue(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">
            Balancing Deviation for Postings
          </h2>
          <p className="text-sm text-muted-foreground">
            Allows uneven distribution of residents across blocks for each
            posting. If deviation exceeds posting capacity, it is capped at
            capacity.
          </p>
        </div>

          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) {
                setShowDropdown(false);
                setSelectedPostings([]);
              }
            }}
          >
            <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Configure posting deviations</DialogTitle>
              <DialogDescription>
                Select one or more postings and apply the same allowed imbalance
                across all 6 blocks.
              </DialogDescription>
            </DialogHeader>

            {/* add new deviations */}
            <div className="flex items-end gap-2">
              {/* Posting selector */}
              <div className="flex-1">
                <Label>Postings</Label>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setShowDropdown((v) => !v)}
                  >
                    {selectedPostings.length === 0
                      ? "Select postings"
                      : `${selectedPostings.length} selected`}
                  </Button>

                  {showDropdown && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {availablePostings.map((posting) => {
                          const checked = selectedPostings.includes(posting);

                          return (
                            <button
                              key={posting}
                              type="button"
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                              onClick={() => {
                                setSelectedPostings((prev) =>
                                  checked
                                    ? prev.filter((p) => p !== posting)
                                    : [...prev, posting]
                                );
                              }}
                            >
                              <Check
                                className={`h-4 w-4 ${
                                  checked ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {posting}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Threshold */}
              <div className="w-24">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  min={1}
                  max={MAX_THRESHOLD}
                  value={threshold}
                  onChange={(e) =>
                    setThreshold(
                      Math.max(
                        1,
                        Math.min(MAX_THRESHOLD, Number(e.target.value) || 1)
                      )
                    )
                  }
                />
              </div>

              {/* Add button */}
              <Button
                className="mb-[2px]"
                onClick={handleAdd}
                disabled={selectedPostings.length === 0}
              >
                Add
              </Button>
            </div>

            {/* configured list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 mt-4 pr-1">
              {configuredPostings.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No deviations configured.
                </p>
              )}

              {configuredPostings.map((posting) => (
                <Item key={posting} className="border-md">
                  <ItemContent>
                    <ItemTitle className="flex items-center gap-1">
                      {posting}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon size={14} />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Max − min residents across 6 blocks
                        </TooltipContent>
                      </Tooltip>
                    </ItemTitle>

                    <ItemDescription className="text-xs">
                      Allowed deviation
                    </ItemDescription>

                    <Input
                      type="number"
                      min={0}
                      max={MAX_THRESHOLD}
                      step={1}
                      value={value[posting]}
                      onChange={handleUpdate(posting)}
                    />
                  </ItemContent>

                  <ItemActions>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(posting)}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* summary */}
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold">Current configuration: </span>
        {configuredPostings.length === 0
          ? "All postings use default balancing (no deviation)."
          : configuredPostings
              .map((p) => `${p}: ${value[p]}`)
              .join(", ")}
      </div>
    </div>
  );
};

export default PostingBalancingDeviationSelector;