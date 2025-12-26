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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { InfoIcon, TrashIcon } from "lucide-react";
import { ALL_POSTINGS } from "@/lib/constants"

interface PostingBalancingDeviationSelectorProps {
  value: Record<string, number>;
  setValue: (val: Record<string, number>) => void;
}

const MAX_THRESHOLD = 15;

const PostingBalancingDeviationSelector: React.FC<
  PostingBalancingDeviationSelectorProps
> = ({ value, setValue }) => {
  const [open, setOpen] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(1);

  const configuredPostings = Object.keys(value);

  const availablePostings = useMemo(
    () => ALL_POSTINGS.filter((p) => !(p in value)),
    [value]
  );

  const handleAdd = (): void => {
    if (!selectedPosting) return;
    setValue({ ...value, [selectedPosting]: threshold });
    setSelectedPosting(null);
    setThreshold(1);
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
            To allow uneven distribution of residents across blocks for
            any posting (except GM, ED, GRM). If deviation is more than posting capacity, 
            it is set to posting capacity value.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Configure posting deviations</DialogTitle>
              <DialogDescription>
                Set how much imbalance (less than or equal to posting capacity) is allowed between the maximum and
                minimum number of residents assigned across 6 blocks.
              </DialogDescription>
            </DialogHeader>

            {/* add new deviation */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Posting</Label>
                <Select
                  value={selectedPosting ?? ""}
                  onValueChange={setSelectedPosting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select posting" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePostings.map((posting) => (
                      <SelectItem key={posting} value={posting}>
                        {posting}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-24">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  min={1}
                  max={MAX_THRESHOLD}
                  step={1}
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

              <Button
                onClick={handleAdd}
                disabled={!selectedPosting}
              >
                Add
              </Button>
            </div>

            {/* configured list */}
            <div className="flex flex-col gap-3 mt-4">
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
                          Max − min residents assigned across 6 blocks
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
        <span className="font-semibold">Current configuration </span>
        {configuredPostings.length === 0
          ? " All postings use default balancing (no deviation)."
          : configuredPostings
              .map((p) => `${p}: ${value[p]}`)
              .join(", ")}
      </div>
    </div>
  );
};

export default PostingBalancingDeviationSelector;