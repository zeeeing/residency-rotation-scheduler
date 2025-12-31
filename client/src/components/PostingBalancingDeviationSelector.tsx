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

interface PostingBalancingDeviationSelectorProps {
  value: Record<string, number>;
  setValue: (val: Record<string, number>) => void;
  postings: string[];
}

const MAX_THRESHOLD = 15;
const DEFAULT_PREFIXES = ["ED", "GRM", "GM"];
const DEFAULT_DEVIATION = 4;

const PostingBalancingDeviationSelector: React.FC<
  PostingBalancingDeviationSelectorProps
> = ({ value, setValue, postings }) => {
  const [open, setOpen] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(1);

  const configuredPostings = Object.keys(value);

  const availablePostings = useMemo(() => {
    const excluded = new Set(["GRM (TTSH)", "MedComm (TTSH)"]);

    const hasSharedGRM =
      "GRM+MedComm (TTSH)" in value ||
      "GRM (TTSH)" in value ||
      "MedComm (TTSH)" in value;

    const normalPostings = postings.filter((p) => {
      // hide already-configured postings
      if (p in value) return false;

      // hide individual GRM/MedComm if shared is already configured
      if (excluded.has(p) && hasSharedGRM) return false;

      return true;
    });

    const result = [...normalPostings];

    // only show shared option if neither individual nor shared is configured
    if (!hasSharedGRM) {
      result.push("GRM+MedComm (TTSH)");
    }

    return result.sort();
  }, [postings, value]);

  const handleAdd = (): void => {
    if (!selectedPosting) return;
    setValue({ ...value, [selectedPosting]: threshold });
    setSelectedPosting(null);
    setThreshold(1);
  };

  const handleAddDefaultDeviations = (): void => {
    const next = { ...value };

    postings.forEach((posting) => {
      // GRM and MedComm have a shared key
      if (posting === "GRM (TTSH)" || posting === "MedComm (TTSH)") {
        if (!("GRM+MedComm (TTSH)" in next)) {
          next["GRM+MedComm (TTSH)"] = DEFAULT_DEVIATION;
        }
        return;
      }

      const matchesPrefix = DEFAULT_PREFIXES.some((prefix) =>
        posting.startsWith(prefix)
      );

      if (matchesPrefix && !(posting in next)) {
        next[posting] = DEFAULT_DEVIATION;
      }
    });

    setValue(next);
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
            any posting. If deviation is more than posting capacity, 
            it is set to posting capacity value.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddDefaultDeviations}
                >
                  Add defaults for ED / GRM / GM
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Adds deviation = 4 for postings starting with ED, GRM, or GM
              </TooltipContent>
            </Tooltip>

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