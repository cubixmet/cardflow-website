"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  Camera,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { PhotoUploader } from "@/components/collect/PhotoUploader";
import { dataUrlToFile } from "@/lib/data-url";
import {
  extractImageFramesByFieldKey,
  framePreviewBoxStyle,
  resolveImageFrame,
  resolvePhotoFrame,
  type PhotoFrame,
} from "@/lib/photo-frame";

type Level1 = { id: string; name: string; children: { id: string; name: string; level1_id: string }[] };
type SchemaField = {
  key: string;
  label: string;
  field_type: string;
  is_required: boolean;
  is_unique: boolean;
  placeholder?: string;
  help_text?: string;
  options?: { value: string; label: string }[];
};

type ConfigResponse = {
  organisation: {
    name: string;
    code?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    level1_label: string;
    level2_label: string;
    logo_url?: string;
  };
  link: { name: string };
  accepts_submissions: boolean;
  blocked_reason?: string;
  message?: string;
};

function isMediaField(field: SchemaField) {
  return field.field_type === "image" || field.field_type === "photo" || field.field_type === "signature";
}

function normalizeApiErrors(raw: Record<string, unknown>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const field = key.replace(/^data\./, "");
    if (!field || field === "non_field_errors" || field === "success" || field === "max_size_mb") {
      continue;
    }
    if (Array.isArray(value)) {
      next[field] = String(value[0] ?? "Invalid value");
    } else if (typeof value === "string") {
      next[field] = value;
    } else if (value != null) {
      next[field] = String(value);
    }
  }
  return next;
}

function submitMessageFromApi(body: {
  detail?: string;
  message?: string;
  errors?: Record<string, unknown>;
}): string {
  const fieldErrors = body.errors ? normalizeApiErrors(body.errors) : {};
  const firstFieldError = Object.values(fieldErrors)[0];
  const detail = body.detail || body.message || "";
  if (firstFieldError && /failed validation|validation failed|validation error/i.test(detail)) {
    return firstFieldError;
  }
  return detail || firstFieldError || "Submission failed. Please check the form.";
}

function fieldLabel(field: SchemaField) {
  return `${field.label}${field.is_required ? " *" : ""}`;
}

/** Normalize stored/API dates to YYYY-MM-DD for <input type="date">. */
function toDateInputValue(raw: string | undefined): string {
  if (!raw) return "";
  const value = String(raw).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})$/.exec(value);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[3].padStart(2, "0");
    return `${dmy[4]}-${mm}-${dd}`;
  }
  return "";
}

export function CollectDataForm() {
  const params = useParams<{ orgId: string; linkId: string }>();
  const orgId = params.orgId;
  const linkId = params.linkId;
  const formRef = useRef<HTMLFormElement>(null);

  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [levels, setLevels] = useState<Level1[]>([]);
  const [level1Id, setLevel1Id] = useState("");
  const [level2Id, setLevel2Id] = useState("");
  const [schema, setSchema] = useState<SchemaField[]>([]);
  const [designDocument, setDesignDocument] = useState<Record<string, unknown> | null>(null);
  const [photoFrame, setPhotoFrame] = useState<PhotoFrame | null>(null);
  const [uniqueKey, setUniqueKey] = useState("");
  const [holderCode, setHolderCode] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [pendingImages, setPendingImages] = useState<Record<string, string>>({});
  const [photoEditorKey, setPhotoEditorKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [cfgRes, lvlRes] = await Promise.all([
          fetch(`/server/collect-data/${orgId}/${linkId}/`),
          fetch(`/server/collect-data/${orgId}/${linkId}/levels/`),
        ]);
        const cfg = (await cfgRes.json()) as ConfigResponse;
        const lvl = (await lvlRes.json()) as { results: Level1[] };
        setConfig(cfg);
        setLevels(lvl.results || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId, linkId]);

  const level2Options = useMemo(() => {
    const l1 = levels.find((l) => l.id === level1Id);
    return l1?.children ?? [];
  }, [levels, level1Id]);

  useEffect(() => {
    if (!level2Id) return;
    if (!level2Options.some((l) => l.id === level2Id)) {
      setLevel2Id("");
    }
  }, [level1Id, level2Id, level2Options]);

  useEffect(() => {
    if (!level1Id || !level2Id) {
      setSchema([]);
      setDesignDocument(null);
      setPhotoFrame(null);
      return;
    }
    let cancelled = false;
    setSchemaLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/server/collect-data/${orgId}/${linkId}/schema/?level1=${level1Id}&level2=${level2Id}`,
        );
        const data = (await res.json()) as {
          fields?: SchemaField[];
          document?: Record<string, unknown> | null;
          photo_frame?: {
            width_mm?: number;
            height_mm?: number;
            radius_mm?: number;
            aspect?: number;
            image_shape?: string;
            sides?: number;
          } | null;
          detail?: string;
        };
        if (!res.ok) {
          throw new Error(data.detail || "Could not load form fields.");
        }
        if (cancelled) return;
        const fields = data.fields || [];
        setSchema(fields);
        setDesignDocument(data.document ?? null);
        setPhotoFrame(resolvePhotoFrame(data.photo_frame, data.document ?? null));
        const unique =
          fields.find((f) => f.is_unique && f.is_required) ||
          fields.find((f) => f.is_unique);
        setUniqueKey(unique?.key || "");
        setValues({});
        setPendingImages({});
        setPhotoEditorKey(null);
        setErrors({});
        setHolderCode("");
      } catch (err) {
        if (!cancelled) {
          setSchema([]);
          setDesignDocument(null);
          setPhotoFrame(null);
          setSubmitError(err instanceof Error ? err.message : "Could not load form fields.");
        }
      } finally {
        if (!cancelled) setSchemaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, linkId, level1Id, level2Id]);

  const mediaFields = useMemo(() => schema.filter(isMediaField), [schema]);
  const textFields = useMemo(
    () => schema.filter((f) => f.key !== uniqueKey && !isMediaField(f)),
    [schema, uniqueKey],
  );
  const uniqueField = schema.find((f) => f.key === uniqueKey);
  const uniqueLabel = uniqueField?.label || "Unique ID";
  const uniqueRequired = Boolean(uniqueField?.is_required);
  const imageFramesByKey = useMemo(
    () => extractImageFramesByFieldKey(designDocument),
    [designDocument],
  );

  const frameForField = (fieldKey: string, fieldType: string): PhotoFrame => {
    const role = fieldType === "photo" || fieldKey === "photo" ? "photo" : "image";
    const fromDoc = resolveImageFrame(imageFramesByKey, fieldKey, role);
    if (imageFramesByKey[fieldKey] || imageFramesByKey.__primary__) {
      return fromDoc;
    }
    return photoFrame ?? fromDoc;
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!level1Id) next.level1 = "Please select a level.";
    if (!level2Id) next.level2 = "Please select a sub-level.";
    if (!holderCode.trim() && uniqueRequired) next[uniqueKey] = `${uniqueLabel} is required.`;

    for (const field of textFields) {
      if (field.is_required && !(values[field.key] || "").trim()) {
        next[field.key] = `${field.label} is required.`;
      }
    }

    for (const field of mediaFields) {
      if (!pendingImages[field.key]) {
        next[field.key] = `${field.label} is required.`;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setAttemptedSubmit(true);
    if (!validate()) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setSubmitting(true);
    try {
      const dataPayload: Record<string, string> = { ...values };
      if (uniqueKey && holderCode.trim()) {
        dataPayload[uniqueKey] = holderCode.trim();
      }

      const fd = new FormData();
      fd.set("holder_code", "");
      fd.set("level1", level1Id);
      fd.set("level2", level2Id);
      fd.set("data", JSON.stringify(dataPayload));
      for (const [key, dataUrl] of Object.entries(pendingImages)) {
        fd.set(key, dataUrlToFile(dataUrl, `${key}.jpg`));
      }

      const res = await fetch(`/server/collect-data/${orgId}/${linkId}/submit/`, {
        method: "POST",
        body: fd,
      });
      const body = (await res.json().catch(() => ({}))) as {
        detail?: string;
        message?: string;
        errors?: Record<string, unknown>;
      };

      if (!res.ok) {
        if (body.errors && typeof body.errors === "object") {
          const fieldErrors = normalizeApiErrors(body.errors);
          if (fieldErrors.holder_code && uniqueKey !== "holder_code") {
            fieldErrors[uniqueKey] = fieldErrors.holder_code;
            delete fieldErrors.holder_code;
          }
          setErrors(fieldErrors);
        }
        throw new Error(submitMessageFromApi(body));
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const setPendingImage = (key: string, dataUrl: string | null) => {
    setPendingImages((prev) => {
      const next = { ...prev };
      if (dataUrl) next[key] = dataUrl;
      else delete next[key];
      return next;
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-12">
        <div className="h-40 rounded-3xl bg-muted/40" />
        <div className="h-96 rounded-3xl bg-muted/30" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">This collection link could not be loaded.</p>
      </div>
    );
  }

  if (!config.accepts_submissions) {
    return (
      <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-8 py-10 text-center">
          <Building2 className="mx-auto mb-4 size-10 text-primary" />
          <h1 className="text-2xl font-bold">{config.organisation.name}</h1>
          <p className="mt-4 text-muted-foreground">{config.message || "Submissions are closed."}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-emerald-500/20 bg-card shadow-2xl">
        <div className="bg-gradient-to-br from-emerald-500/15 via-background to-primary/10 px-8 py-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 size-14 text-emerald-500" />
          <h1 className="text-2xl font-bold">Submission received</h1>
          <p className="mt-3 text-muted-foreground">
            Thank you. Your information was sent to {config.organisation.name} and is pending review.
          </p>
        </div>
      </div>
    );
  }

  const org = config.organisation;
  const errorCount = Object.keys(errors).length;

  return (
    <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-6 md:pt-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb,59,130,246),0.12),transparent_65%)]" />

      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="border-b border-border/70 bg-gradient-to-br from-primary/10 via-card to-secondary/5 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                {org.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={org.logo_url} alt="" className="size-full object-cover" />
                ) : (
                  <Building2 className="size-8 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Secure submission</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{org.name}</h1>
                {org.code ? <p className="mt-1 text-sm text-muted-foreground">Code: {org.code}</p> : null}
                <p className="mt-2 text-base text-muted-foreground">{config.link.name}</p>
              </div>
            </div>

            {(org.address || org.phone || org.email || org.website) && (
              <div className="mt-6 grid gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 sm:grid-cols-2">
                {org.address ? (
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{org.address}</span>
                  </div>
                ) : null}
                {org.phone ? (
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                    <a href={`tel:${org.phone}`} className="hover:text-foreground">
                      {org.phone}
                    </a>
                  </div>
                ) : null}
                {org.email ? (
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                    <a href={`mailto:${org.email}`} className="hover:text-foreground">
                      {org.email}
                    </a>
                  </div>
                ) : null}
                {org.website ? (
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Globe className="mt-0.5 size-4 shrink-0 text-primary" />
                    <a href={org.website} target="_blank" rel="noreferrer" className="truncate hover:text-foreground">
                      {org.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-8 px-6 py-8 md:px-8">
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Fill in your details below. Required fields are marked with *. Uploaded photos are mandatory
                where shown. Your submission will be reviewed before approval.
              </p>
            </div>

            {attemptedSubmit && errorCount > 0 ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Please fix {errorCount} highlighted field{errorCount === 1 ? "" : "s"} before submitting.
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your level</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{org.level1_label || "Level 1"} *</label>
                  <select
                    className={`h-12 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.level1 ? "border-destructive" : "border-border"
                    }`}
                    value={level1Id}
                    onChange={(e) => {
                      setLevel1Id(e.target.value);
                      setLevel2Id("");
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.level1;
                        delete next.level2;
                        return next;
                      });
                    }}
                  >
                    <option value="">Select…</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  {errors.level1 ? <p className="text-xs text-destructive">{errors.level1}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{org.level2_label || "Level 2"} *</label>
                  <select
                    className={`h-12 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${
                      errors.level2 ? "border-destructive" : "border-border"
                    }`}
                    value={level2Id}
                    disabled={!level1Id}
                    onChange={(e) => {
                      setLevel2Id(e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.level2;
                        return next;
                      });
                    }}
                  >
                    <option value="">Select…</option>
                    {level2Options.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  {errors.level2 ? <p className="text-xs text-destructive">{errors.level2}</p> : null}
                </div>
              </div>
            </div>

            {level1Id && level2Id ? (
              schemaLoading ? (
                <p className="text-sm text-muted-foreground">Loading form fields…</p>
              ) : (
                <>
                  <div className="space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Your details
                    </h2>
                    <Input
                      label={`${uniqueLabel} *`}
                      value={holderCode}
                      onChange={(e) => {
                        setHolderCode(e.target.value);
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next[uniqueKey];
                          return next;
                        });
                      }}
                      error={errors[uniqueKey]}
                      required
                    />

                    {textFields.map((field) => {
                      const clearFieldError = () =>
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next[field.key];
                          return next;
                        });
                      const setFieldValue = (value: string) => {
                        setValues((v) => ({ ...v, [field.key]: value }));
                        clearFieldError();
                      };

                      return (
                      <div key={field.key} className="space-y-1.5">
                        {field.field_type === "dropdown" || field.field_type === "radio" ? (
                          <>
                            <label className="text-sm font-medium">{fieldLabel(field)}</label>
                            <select
                              className={`h-12 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors[field.key] ? "border-destructive" : "border-border"
                              }`}
                              value={values[field.key] || ""}
                              onChange={(e) => setFieldValue(e.target.value)}
                            >
                              <option value="">Select…</option>
                              {(field.options || []).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : field.field_type === "date" ? (
                          <Input
                            type="date"
                            label={fieldLabel(field)}
                            value={toDateInputValue(values[field.key])}
                            max="2100-12-31"
                            min="1900-01-01"
                            onChange={(e) => setFieldValue(e.target.value)}
                            error={errors[field.key]}
                            className="h-12 rounded-xl"
                          />
                        ) : field.field_type === "textarea" ? (
                          <div className="w-full text-left">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                              {fieldLabel(field)}
                            </label>
                            <textarea
                              className={`min-h-24 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors[field.key] ? "border-destructive" : "border-border"
                              }`}
                              value={values[field.key] || ""}
                              placeholder={field.placeholder}
                              onChange={(e) => setFieldValue(e.target.value)}
                            />
                            {errors[field.key] ? (
                              <p className="mt-1 text-[13px] font-medium text-error">{errors[field.key]}</p>
                            ) : null}
                          </div>
                        ) : (
                          <Input
                            type={
                              field.field_type === "email"
                                ? "email"
                                : field.field_type === "phone"
                                  ? "tel"
                                  : field.field_type === "number"
                                    ? "number"
                                    : "text"
                            }
                            label={fieldLabel(field)}
                            value={values[field.key] || ""}
                            placeholder={field.placeholder}
                            onChange={(e) => setFieldValue(e.target.value)}
                            error={errors[field.key]}
                          />
                        )}
                        {field.help_text ? (
                          <p className="text-xs text-muted-foreground">{field.help_text}</p>
                        ) : null}
                        {errors[field.key] &&
                        (field.field_type === "dropdown" || field.field_type === "radio") ? (
                          <p className="text-xs text-destructive">{errors[field.key]}</p>
                        ) : null}
                      </div>
                      );
                    })}
                  </div>

                  {mediaFields.length > 0 ? (
                    <div className="space-y-4">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Required photos
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {mediaFields.map((field) => {
                          const fieldFrame = frameForField(field.key, field.field_type);
                          const thumbStyle = framePreviewBoxStyle(fieldFrame, 160);
                          const hasPhoto = Boolean(pendingImages[field.key]);
                          return (
                          <button
                            key={field.key}
                            type="button"
                            onClick={() => setPhotoEditorKey(field.key)}
                            className={`w-full rounded-2xl border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                              errors[field.key] ? "border-destructive bg-destructive/5" : "border-border bg-muted/20"
                            }`}
                            aria-label={
                              hasPhoto
                                ? `Edit ${field.label}`
                                : `Add ${field.label}`
                            }
                          >
                            <div className="mb-3 flex items-center gap-2">
                              <Camera className="size-4 text-primary" />
                              <span className="text-sm font-medium">{field.label} *</span>
                            </div>
                            <div className="mb-3 flex justify-center">
                              {hasPhoto ? (
                                <div
                                  className="border border-border bg-background"
                                  style={thumbStyle}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={pendingImages[field.key]}
                                    alt={field.label}
                                    className="size-full object-cover"
                                    style={{
                                      borderRadius: thumbStyle.borderRadius,
                                      clipPath: thumbStyle.clipPath,
                                      WebkitClipPath: thumbStyle.WebkitClipPath,
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="flex flex-col items-center justify-center gap-2 border border-dashed border-border bg-background/80"
                                  style={thumbStyle}
                                >
                                  <Camera className="size-8 text-muted-foreground/50" />
                                  <span className="px-2 text-center text-xs text-muted-foreground">
                                    Tap to add photo
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary">
                              <Sparkles className="size-3.5" />
                              {hasPhoto ? "Tap to enhance or replace" : "Tap to capture or upload"}
                            </p>
                            {errors[field.key] ? (
                              <p className="mt-2 text-xs text-destructive">{errors[field.key]}</p>
                            ) : null}
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </>
              )
            ) : null}
          </div>

          <div className="border-t border-border/70 bg-muted/20 px-6 py-6 md:px-8">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              isLoading={submitting}
              disabled={submitting || !level1Id || !level2Id || schemaLoading || schema.length === 0}
            >
              Submit for review
            </Button>
          </div>
        </section>
      </form>

      {photoEditorKey ? (
        <PhotoUploader
          open={Boolean(photoEditorKey)}
          onOpenChange={(open) => {
            if (!open) setPhotoEditorKey(null);
          }}
          currentPhoto={pendingImages[photoEditorKey] || null}
          personName={holderCode.trim() || values.name || config.organisation.name}
          fieldLabel={mediaFields.find((f) => f.key === photoEditorKey)?.label || "Photo"}
          frame={frameForField(
            photoEditorKey,
            mediaFields.find((f) => f.key === photoEditorKey)?.field_type || "photo",
          )}
          designDocument={designDocument}
          onSave={async (dataUrl) => {
            setPendingImage(photoEditorKey, dataUrl);
          }}
          onRemove={async () => {
            setPendingImage(photoEditorKey, null);
          }}
        />
      ) : null}
    </div>
  );
}
