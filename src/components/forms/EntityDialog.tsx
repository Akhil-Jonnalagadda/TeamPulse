import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export type FieldType = "text" | "textarea" | "number" | "select" | "switch" | "time" | "date";

export interface FieldSpec {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  full?: boolean;
  help?: string;
}

export type FormValues = Record<string, string | number | boolean | null>;

export function defaultsFor(fields: FieldSpec[]): FormValues {
  const out: FormValues = {};
  for (const f of fields) {
    out[f.name] =
      f.type === "switch" ? false : f.type === "number" ? (f.min ?? 0) : f.options?.[0]?.value ?? "";
  }
  return out;
}

export function EntityDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitLabel = "Save",
  pending,
  onSubmit,
  trigger,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  fields: FieldSpec[];
  initial?: FormValues;
  submitLabel?: string;
  pending?: boolean;
  onSubmit: (values: FormValues) => void | Promise<void>;
  trigger?: ReactNode;
}) {
  const [values, setValues] = useState<FormValues>(() => ({ ...defaultsFor(fields), ...initial }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues({ ...defaultsFor(fields), ...initial });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set(name: string, value: string | number | boolean | null) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function submit() {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (!f.required) continue;
      const v = values[f.name];
      if (v === null || v === "" || (typeof v === "string" && v.trim() === "")) {
        next[f.name] = `${f.label} is required`;
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    void onSubmit(values);
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <ScrollArea className="max-h-[62vh]">
            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <div className="space-y-1.5">
                    {f.type !== "switch" && <Label htmlFor={f.name}>{f.label}</Label>}
                    {f.type === "textarea" && (
                      <Textarea
                        id={f.name}
                        rows={3}
                        maxLength={f.maxLength ?? 2000}
                        placeholder={f.placeholder}
                        value={String(values[f.name] ?? "")}
                        onChange={(e) => set(f.name, e.target.value)}
                      />
                    )}
                    {(f.type === "text" || f.type === "time" || f.type === "date") && (
                      <Input
                        id={f.name}
                        type={f.type === "text" ? "text" : f.type}
                        maxLength={f.maxLength ?? 200}
                        placeholder={f.placeholder}
                        value={String(values[f.name] ?? "")}
                        onChange={(e) => set(f.name, e.target.value)}
                      />
                    )}
                    {f.type === "number" && (
                      <Input
                        id={f.name}
                        type="number"
                        min={f.min ?? 0}
                        max={f.max}
                        step={f.step ?? 1}
                        value={String(values[f.name] ?? 0)}
                        onChange={(e) => set(f.name, e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                    )}
                    {f.type === "select" && (
                      <Select
                        value={String(values[f.name] ?? "")}
                        onValueChange={(v) => set(f.name, v)}
                      >
                        <SelectTrigger id={f.name}>
                          <SelectValue placeholder={f.placeholder ?? "Select"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(f.options ?? []).map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {f.type === "switch" && (
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                        <Label htmlFor={f.name} className="text-sm font-normal">
                          {f.label}
                        </Label>
                        <Switch
                          id={f.name}
                          checked={Boolean(values[f.name])}
                          onCheckedChange={(v) => set(f.name, v)}
                        />
                      </div>
                    )}
                    {f.help && <p className="text-muted-foreground text-xs">{f.help}</p>}
                    {errors[f.name] && <p className="text-destructive text-xs">{errors[f.name]}</p>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="border-t px-5 py-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
